import {
  buildGatewayServiceHeaders,
  getSocialGatewayConfig,
} from '@/lib/social-gateway-bff.util';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { resolveMtoCallerIdentityFromSession } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';
import { buildAuthorizeResumeBody } from '@/features/portal-mock-test/server/authorize-resume-body.server';

export const MTO_REGISTRATION_ID_HEADER = 'X-Mto-Registration-Id';

export type MintedMtoPortalAuthorize = {
  portalAuthorizeToken: string;
  portalAuthorizeExpiresAt?: string;
  registrationId: number;
  formPublicId?: string;
  sessionId?: number;
};

type MintCacheRow = {
  minted?: MintedMtoPortalAuthorize;
  /** Thời điểm cache khi response không có expiresAt. */
  cachedAtMs?: number;
  inflight?: Promise<MintedMtoPortalAuthorize | null>;
};

/** Cache mint HMAC — tránh mỗi quiz-runtime GET gọi lại CRM session + GW authorize-resume. */
const mintCache = new Map<number, MintCacheRow>();

/** Còn ít nhất bao nhiêu ms mới tái dùng cache (buffer trước exp). */
const MINT_CACHE_MIN_REMAINING_MS = 60_000;
/** Fallback TTL khi GW không trả expiresAt. */
const MINT_CACHE_FALLBACK_TTL_MS = 90_000;

function isMintCacheFresh(row: MintCacheRow): boolean {
  const minted = row.minted;
  if (!minted?.portalAuthorizeToken?.trim()) return false;
  const expRaw = minted.portalAuthorizeExpiresAt?.trim();
  if (expRaw) {
    const exp = Date.parse(expRaw);
    if (!Number.isFinite(exp)) return false;
    return exp - Date.now() >= MINT_CACHE_MIN_REMAINING_MS;
  }
  const cachedAt = row.cachedAtMs ?? 0;
  return Date.now() - cachedAt < MINT_CACHE_FALLBACK_TTL_MS;
}

function peekMintCache(registrationId: number): MintedMtoPortalAuthorize | null {
  const row = mintCache.get(registrationId);
  if (!row?.minted) return null;
  if (!isMintCacheFresh(row)) {
    if (!row.inflight) mintCache.delete(registrationId);
    return null;
  }
  return row.minted;
}

export function invalidateMtoPortalAuthorizeMintCache(
  registrationId?: number,
): void {
  if (registrationId != null && registrationId >= 1) {
    mintCache.delete(registrationId);
    return;
  }
  mintCache.clear();
}

/**
 * Mint HMAC portalAuthorizeToken server-side (PO-D25).
 * Resume / quiz-runtime: tái dùng token còn hạn — không gọi CRM/GW lặp lại.
 */
export async function mintMtoPortalAuthorizeToken(input: {
  registrationId: number;
  examSessionToken?: string;
  forceRefresh?: boolean;
}): Promise<MintedMtoPortalAuthorize | null> {
  const registrationId = Number(input.registrationId);
  if (!Number.isFinite(registrationId) || registrationId < 1) return null;

  if (input.forceRefresh) {
    mintCache.delete(registrationId);
  } else {
    const cached = peekMintCache(registrationId);
    if (cached) return cached;
    const existing = mintCache.get(registrationId)?.inflight;
    if (existing) return existing;
  }

  const promise = mintMtoPortalAuthorizeTokenUncached({
    registrationId,
    examSessionToken: input.examSessionToken,
  }).finally(() => {
    const row = mintCache.get(registrationId);
    if (row) delete row.inflight;
  });

  const prev = mintCache.get(registrationId);
  mintCache.set(registrationId, {
    minted: prev?.minted,
    cachedAtMs: prev?.cachedAtMs,
    inflight: promise,
  });

  const minted = await promise;
  if (minted?.portalAuthorizeToken?.trim()) {
    mintCache.set(registrationId, {
      minted,
      cachedAtMs: Date.now(),
    });
  } else {
    mintCache.delete(registrationId);
  }
  return minted;
}

async function mintMtoPortalAuthorizeTokenUncached(input: {
  registrationId: number;
  examSessionToken?: string;
}): Promise<MintedMtoPortalAuthorize | null> {
  const registrationId = input.registrationId;
  const cfg = getSocialGatewayConfig();
  if (!cfg) return null;

  const session = await resolvePortalSessionFromCookies();
  if (session.actor === 'guest') return null;

  const resolved = await resolveMtoCallerIdentityFromSession(session);
  const omniLeadId = resolved.ok ? resolved.identity.omniLeadId : undefined;

  const body = buildAuthorizeResumeBody(
    {
      registrationId,
      ...(input.examSessionToken?.trim()
        ? { examSessionToken: input.examSessionToken.trim() }
        : {}),
    },
    omniLeadId,
  );

  try {
    const res = await fetch(
      `${cfg.baseUrl}/api/v1/public/mock-test-online/authorize-resume`,
      {
        method: 'POST',
        headers: buildGatewayServiceHeaders(cfg),
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      allowed?: boolean;
      portalAuthorizeToken?: string;
      portalAuthorizeExpiresAt?: string;
      registrationId?: number;
      formPublicId?: string;
      sessionId?: number;
    };
    if (!res.ok || data.allowed !== true) return null;
    const token = data.portalAuthorizeToken?.trim();
    if (!token) return null;
    return {
      portalAuthorizeToken: token,
      portalAuthorizeExpiresAt: data.portalAuthorizeExpiresAt,
      registrationId:
        typeof data.registrationId === 'number'
          ? data.registrationId
          : registrationId,
      formPublicId: data.formPublicId,
      sessionId: data.sessionId,
    };
  } catch {
    return null;
  }
}

export function parseRegistrationIdHeader(
  value: string | null | undefined,
): number | null {
  const raw = value?.trim() || '';
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

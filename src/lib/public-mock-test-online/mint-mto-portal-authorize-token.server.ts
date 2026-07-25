import {
  buildGatewayServiceHeaders,
  getSocialGatewayConfig,
} from '@/lib/social-gateway-bff.util';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { fetchCustomerOnlineBootstrapContextSsr } from '@/features/portal-mock-test/server/fetch-customer-bootstrap-context.server';
import { buildAuthorizeResumeBody } from '@/features/portal-mock-test/server/authorize-resume-body.server';

export const MTO_REGISTRATION_ID_HEADER = 'X-Mto-Registration-Id';

export type MintedMtoPortalAuthorize = {
  portalAuthorizeToken: string;
  portalAuthorizeExpiresAt?: string;
  registrationId: number;
  formPublicId?: string;
  sessionId?: number;
};

/**
 * Mint HMAC portalAuthorizeToken server-side (PO-D25) — giống Quiz BFF inject capability,
 * không dùng cookie `mto_portal_auth`. Browser chỉ gửi registrationId + portal_at.
 */
export async function mintMtoPortalAuthorizeToken(input: {
  registrationId: number;
  examSessionToken?: string;
}): Promise<MintedMtoPortalAuthorize | null> {
  const registrationId = Number(input.registrationId);
  if (!Number.isFinite(registrationId) || registrationId < 1) return null;

  const cfg = getSocialGatewayConfig();
  if (!cfg) return null;

  const session = await resolvePortalSessionFromCookies();
  if (session.actor === 'guest') return null;

  let omniLeadId: string | undefined;
  if (session.actor === 'lead') {
    omniLeadId = session.omniLeadId;
  } else if (session.actor === 'customer') {
    const context = await fetchCustomerOnlineBootstrapContextSsr();
    if (context?.customerId === session.customer.id) {
      omniLeadId = context.omniLeadId;
    }
  }

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

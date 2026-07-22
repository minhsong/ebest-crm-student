import { NextResponse } from 'next/server';
import type { PortalAuthActor } from '@/lib/portal-auth/portal-auth-session';
import type { PortalLoginActorPayload } from '@/lib/portal-auth/portal-auth-session';
import { applyPortalSessionAccessToken } from '@/lib/portal-auth/portal-auth-session.server';

export function readAccessTokenFromCrmPayload(
  payload: { accessToken?: unknown } | null | undefined,
): string {
  return typeof payload?.accessToken === 'string'
    ? payload.accessToken.trim()
    : '';
}

/** Ghi cookie portal từ accessToken CRM. Trả true nếu đã set. */
export function applyPortalAccessTokenCookie(
  _actor: PortalAuthActor,
  accessToken: string | null | undefined,
): boolean {
  const token = accessToken?.trim() ?? '';
  if (!token) return false;
  applyPortalSessionAccessToken(token);
  return true;
}

/**
 * Password login success — set cookie + response allowlist (không lộ JWT).
 */
export function respondPortalPasswordLoginSuccess(
  mode: PortalAuthActor,
  payload: PortalLoginActorPayload,
): NextResponse {
  applyPortalAccessTokenCookie(mode, readAccessTokenFromCrmPayload(payload));

  if (mode === 'lead') {
    return NextResponse.json({
      actor: 'lead' as const,
      account: payload.account ?? payload.leadAccount ?? null,
    });
  }

  return NextResponse.json({
    actor: 'customer' as const,
    customer: payload.customer ?? null,
  });
}

/**
 * Register-by-token / session flows — set cookie customer + body đã strip token.
 */
export function respondPortalCustomerSessionSuccess(input: {
  payload: Record<string, unknown>;
  messageFallback: string;
  sanitizeMessage: (raw: string, fallback: string) => string;
}): NextResponse {
  const token = readAccessTokenFromCrmPayload(input.payload);
  applyPortalAccessTokenCookie('customer', token);

  return NextResponse.json({
    registered: input.payload.registered === true,
    googleLinked: input.payload.googleLinked === true,
    actor: 'customer' as const,
    customer: input.payload.customer ?? null,
    message: input.sanitizeMessage(
      typeof input.payload.message === 'string' ? input.payload.message : '',
      input.messageFallback,
    ),
  });
}

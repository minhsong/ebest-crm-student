import { evaluateFunnelMatchesPortalActor } from '@/features/portal-mock-test/server/assert-funnel-identity.server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { getMockTestOnlineFunnelSessionId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { fetchGatewayFunnelSession } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';

export type ConfirmSessionOwnershipResult =
  | { ok: true; funnelSessionId: string }
  | { ok: false; status: number; message: string };

export function funnelOwnsPendingRegistration(
  funnelPendingRegistrationId: string | null | undefined,
  pendingRegistrationId: string,
): boolean {
  const owned = funnelPendingRegistrationId?.trim() || '';
  const requested = pendingRegistrationId.trim();
  return Boolean(owned) && owned === requested;
}

export function funnelOwnsSelectRequest(
  funnelSessionId: string | null | undefined,
  pendingLeadId: string,
): boolean {
  const funnelId = funnelSessionId?.trim() || '';
  const pendingId = pendingLeadId.trim();
  return Boolean(funnelId) && funnelId === pendingId;
}

/**
 * P5h — confirm-session / pending status không còn là bearer-capability chỉ từ UUID.
 * Bắt buộc HttpOnly funnel cookie khớp pendingRegistrationId (+ actor nếu đã login).
 */
export async function resolveConfirmSessionOwnership(
  pendingRegistrationId: string,
): Promise<ConfirmSessionOwnershipResult> {
  const pendingId = pendingRegistrationId.trim();
  if (!pendingId) {
    return {
      ok: false,
      status: 400,
      message: 'Thiếu mã phiên xác minh.',
    };
  }

  const funnelSessionId = getMockTestOnlineFunnelSessionId()?.trim() || '';
  if (!funnelSessionId) {
    return {
      ok: false,
      status: 403,
      message: 'Phiên đăng ký không hợp lệ hoặc đã hết hạn.',
    };
  }

  const funnel = await fetchGatewayFunnelSession(funnelSessionId);
  if (!funnel) {
    return {
      ok: false,
      status: 403,
      message: 'Phiên đăng ký không hợp lệ hoặc đã hết hạn.',
    };
  }

  if (!funnelOwnsPendingRegistration(funnel.pendingRegistrationId, pendingId)) {
    return {
      ok: false,
      status: 403,
      message: 'Phiên xác minh không khớp đăng ký hiện tại.',
    };
  }

  const session = await resolvePortalSessionFromCookies();
  const actorMatch = evaluateFunnelMatchesPortalActor(
    session,
    funnel,
    funnelSessionId,
  );
  if (!actorMatch.ok) {
    return {
      ok: false,
      status: 403,
      message: 'Phiên đăng nhập không khớp đăng ký thi thử.',
    };
  }

  return { ok: true, funnelSessionId };
}

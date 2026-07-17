import { redirect } from 'next/navigation';
import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';
import type { GatewayFunnelSessionPublic } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

export type FunnelActorMatchResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'missing_funnel' | 'lead_mismatch' | 'customer_mismatch';
    };

/**
 * Pure check — dùng cho page (redirect) và BFF API (403).
 * Guest bỏ qua; authenticated phải khớp omniLeadId / portalCustomerId.
 */
export function evaluateFunnelMatchesPortalActor(
  session: PortalSessionPayload,
  funnel: GatewayFunnelSessionPublic | null,
  pendingLeadId: string,
): FunnelActorMatchResult {
  const pendingId = pendingLeadId.trim();
  if (!pendingId || session.actor === 'guest') {
    return { ok: true };
  }

  if (!funnel?.omniLeadId?.trim()) {
    return { ok: false, reason: 'missing_funnel' };
  }

  if (session.actor === 'lead') {
    if (funnel.omniLeadId.trim() !== session.omniLeadId.trim()) {
      return { ok: false, reason: 'lead_mismatch' };
    }
    return { ok: true };
  }

  if (session.actor === 'customer') {
    if (funnel.portalCustomerId !== session.customer.id) {
      return { ok: false, reason: 'customer_mismatch' };
    }
  }

  return { ok: true };
}

/**
 * P5b — authenticated funnel phải khớp actor cookie (chống hijack pending cookie).
 */
export function assertFunnelMatchesPortalActor(
  session: PortalSessionPayload,
  funnel: GatewayFunnelSessionPublic | null,
  pendingLeadId: string,
): void {
  const result = evaluateFunnelMatchesPortalActor(
    session,
    funnel,
    pendingLeadId,
  );
  if (result.ok) return;

  if (result.reason === 'customer_mismatch') {
    redirect(PORTAL_MOCK_TEST_ROUTES.hub);
  }
  redirect(PORTAL_MOCK_TEST_ROUTES.onlineStart);
}

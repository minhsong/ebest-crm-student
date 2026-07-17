import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';
import type { GatewayFunnelSessionPublic } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import {
  assertFunnelMatchesPortalActor,
  evaluateFunnelMatchesPortalActor,
} from './assert-funnel-identity.server';

function funnel(
  overrides: Partial<GatewayFunnelSessionPublic> = {},
): GatewayFunnelSessionPublic {
  return {
    funnelSessionId: 'pending-1',
    pendingLeadId: 'pending-1',
    omniLeadId: 'omni-1',
    resumeStep: 'select',
    status: 'lead_registered',
    selectedSessionId: null,
    pendingRegistrationId: null,
    primaryPhoneE164: '+84901234567',
    ...overrides,
  };
}

function customerSession(customerId = 42): PortalSessionPayload {
  return {
    actor: 'customer',
    displayName: 'Học viên',
    customer: { id: customerId, fullName: 'Học viên' },
  };
}

describe('assertFunnelMatchesPortalActor', () => {
  beforeEach(() => redirectMock.mockClear());

  it('accepts customer funnel only when portalCustomerId matches', () => {
    assertFunnelMatchesPortalActor(
      customerSession(),
      funnel({ portalCustomerId: 42 }),
      'pending-1',
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('fails closed when customer funnel lacks portalCustomerId', () => {
    assertFunnelMatchesPortalActor(
      customerSession(),
      funnel({ portalCustomerId: null }),
      'pending-1',
    );
    expect(redirectMock).toHaveBeenCalledWith('/mock-test');
  });

  it('rejects a funnel owned by another customer', () => {
    assertFunnelMatchesPortalActor(
      customerSession(),
      funnel({ portalCustomerId: 99 }),
      'pending-1',
    );
    expect(redirectMock).toHaveBeenCalledWith('/mock-test');
  });

  it('evaluate returns customer_mismatch without redirecting', () => {
    expect(
      evaluateFunnelMatchesPortalActor(
        customerSession(),
        funnel({ portalCustomerId: 99 }),
        'pending-1',
      ),
    ).toEqual({ ok: false, reason: 'customer_mismatch' });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

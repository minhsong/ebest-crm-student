import { describe, expect, it } from 'vitest';
import {
  funnelOwnsPendingRegistration,
  funnelOwnsSelectRequest,
} from './assert-confirm-session-ownership.server';
import { evaluateFunnelMatchesPortalActor } from './assert-funnel-identity.server';
import type { GatewayFunnelSessionPublic } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';

function funnel(
  overrides: Partial<GatewayFunnelSessionPublic> = {},
): GatewayFunnelSessionPublic {
  return {
    funnelSessionId: 'funnel-1',
    pendingLeadId: 'funnel-1',
    omniLeadId: 'omni-1',
    resumeStep: 'verify',
    status: 'awaiting_verify',
    selectedSessionId: 12,
    pendingRegistrationId: 'pending-abc',
    primaryPhoneE164: '+84901234567',
    portalCustomerId: 42,
    ...overrides,
  };
}

describe('funnelOwnsPendingRegistration', () => {
  it('accepts exact pending match', () => {
    expect(
      funnelOwnsPendingRegistration('pending-abc', 'pending-abc'),
    ).toBe(true);
  });

  it('rejects mismatched or empty pending', () => {
    expect(funnelOwnsPendingRegistration('pending-a', 'pending-b')).toBe(false);
    expect(funnelOwnsPendingRegistration(null, 'pending-a')).toBe(false);
    expect(funnelOwnsPendingRegistration('pending-a', '')).toBe(false);
  });
});

describe('funnelOwnsSelectRequest', () => {
  it('requires the body pendingLeadId to match the HttpOnly funnel cookie', () => {
    expect(funnelOwnsSelectRequest('funnel-1', 'funnel-1')).toBe(true);
    expect(funnelOwnsSelectRequest('funnel-1', 'funnel-2')).toBe(false);
    expect(funnelOwnsSelectRequest(null, 'funnel-1')).toBe(false);
  });
});

describe('evaluateFunnelMatchesPortalActor for confirm-session', () => {
  it('allows guest with valid funnel pending', () => {
    expect(
      evaluateFunnelMatchesPortalActor({ actor: 'guest' }, funnel(), 'funnel-1'),
    ).toEqual({ ok: true });
  });

  it('rejects authenticated customer owning another funnel', () => {
    expect(
      evaluateFunnelMatchesPortalActor(
        {
          actor: 'customer',
          displayName: 'HV',
          customer: { id: 99, fullName: 'HV' },
        },
        funnel({ portalCustomerId: 42 }),
        'funnel-1',
      ),
    ).toEqual({ ok: false, reason: 'customer_mismatch' });
  });
});

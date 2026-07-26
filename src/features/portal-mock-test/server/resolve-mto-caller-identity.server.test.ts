import { describe, expect, it } from 'vitest';
import {
  stripClientIdentityClaims,
  resolveMtoCallerIdentityFromSession,
} from './resolve-mto-caller-identity.server';

describe('stripClientIdentityClaims', () => {
  it('removes identity claims but keeps business fields', () => {
    const out = stripClientIdentityClaims({
      sessionId: 16,
      omniLeadId: 'evil',
      customerId: 1,
      accountId: '9',
      leadAccountId: 3,
      portalAccountId: 4,
      testVariantChoice: 'full',
    });
    expect(out).toEqual({
      sessionId: 16,
      testVariantChoice: 'full',
    });
  });
});

describe('resolveMtoCallerIdentityFromSession', () => {
  it('maps lead session without extra CRM call', async () => {
    const result = await resolveMtoCallerIdentityFromSession({
      actor: 'lead',
      displayName: 'A',
      omniLeadId: 'lead-1',
      accountId: '696',
      profile: {
        omniLeadId: 'lead-1',
        displayName: 'A',
        phoneE164: '+84938505866',
        profileCompleted: true,
      } as never,
    });
    expect(result).toEqual({
      ok: true,
      identity: {
        actor: 'lead',
        omniLeadId: 'lead-1',
        accountId: '696',
        phoneE164: '+84938505866',
        displayName: 'A',
      },
    });
  });

  it('uses customer omni from portal/session without bootstrap', async () => {
    const result = await resolveMtoCallerIdentityFromSession({
      actor: 'customer',
      displayName: 'HV',
      accountId: '10',
      customer: {
        id: 669,
        fullName: 'HV',
        omniLeadId: 'omni-cust',
        primaryPhone: '+84901234567',
      },
    });
    expect(result).toEqual({
      ok: true,
      identity: {
        actor: 'customer',
        omniLeadId: 'omni-cust',
        accountId: '10',
        customerId: 669,
        phoneE164: '+84901234567',
        displayName: 'HV',
      },
    });
  });

  it('rejects guest', async () => {
    const result = await resolveMtoCallerIdentityFromSession({ actor: 'guest' });
    expect(result).toEqual({ ok: false, reason: 'guest' });
  });
});

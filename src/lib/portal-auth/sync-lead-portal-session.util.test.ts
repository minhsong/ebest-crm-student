import { describe, expect, it } from 'vitest';
import { leadProfileToClientSessionPayload } from './sync-lead-portal-session.util';
import type { LeadProfile } from '@/lib/lead-portal/types';

describe('leadProfileToClientSessionPayload', () => {
  it('strips omniLeadId for client session', () => {
    const profile = {
      id: 9,
      displayName: 'An',
      email: 'a@test.com',
      phoneE164: '8499',
      emailVerifiedAt: null,
      omniLeadId: 'secret-omni',
      profileCompleted: true,
      identityUpgrade: { available: true },
    } as LeadProfile;

    expect(leadProfileToClientSessionPayload(profile)).toMatchObject({
      actor: 'lead',
      displayName: 'An',
      profile: {
        id: 9,
        displayName: 'An',
        email: 'a@test.com',
        phoneE164: '8499',
        emailVerifiedAt: null,
        profileCompleted: true,
      },
    });
    expect(leadProfileToClientSessionPayload(profile).profile).not.toHaveProperty(
      'omniLeadId',
    );
  });
});

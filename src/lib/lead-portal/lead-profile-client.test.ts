import { describe, expect, it } from 'vitest';
import { mapLeadMeForClient } from './lead-profile-client';

describe('mapLeadMeForClient', () => {
  it('maps only googleLinked boolean without exposing Google subject', () => {
    const profile = mapLeadMeForClient({
      id: 1,
      omniLeadId: 'omni-1',
      email: 'user@example.com',
      phoneE164: '+84901234567',
      googleLinked: true,
      googleSub: 'must-not-be-exposed',
      profileCompleted: true,
    });

    expect(profile.googleLinked).toBe(true);
    expect(profile).not.toHaveProperty('googleSub');
  });
});

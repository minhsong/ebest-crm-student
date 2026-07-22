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

  it('fail-closed: thiếu profileCompleted → chưa hoàn thiện hồ sơ', () => {
    const profile = mapLeadMeForClient({
      id: 2,
      omniLeadId: 'omni-2',
      email: 'lead@example.com',
    });
    expect(profile.profileCompleted).toBe(false);
  });
});

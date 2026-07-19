import { describe, expect, it } from 'vitest';
import { requiresCompletedLeadProfile } from './portal-profile-capability';

describe('portal mock-test profile capability', () => {
  it.each(['exam.start', 'exam.resume', 'portal.hub'] as const)(
    'cho phép %s khi hồ sơ chưa hoàn tất',
    (capability) => {
      expect(requiresCompletedLeadProfile(capability)).toBe(false);
    },
  );

  it.each(
    [
      'portal.dashboard',
      'exam.view_result',
      'exam.offline.register',
    ] as const,
  )('yêu cầu hồ sơ hoàn tất cho %s', (capability) => {
    expect(requiresCompletedLeadProfile(capability)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  requiresCompletedLeadProfile,
  shouldEnforceProfileCompletion,
} from './portal-profile-capability';

describe('portal mock-test profile capability', () => {
  it.each(['exam.start', 'exam.resume'] as const)(
    'cho phép %s khi hồ sơ chưa hoàn tất',
    (capability) => {
      expect(requiresCompletedLeadProfile(capability)).toBe(false);
    },
  );

  it.each(
    [
      'portal.hub',
      'portal.dashboard',
      'exam.view_result',
      'exam.offline.register',
    ] as const,
  )('capability %s có thể yêu cầu hồ sơ', (capability) => {
    expect(requiresCompletedLeadProfile(capability)).toBe(true);
  });

  it('PO-D30 — chưa ≥1 bài: không ép hub/results dù hồ sơ thiếu', () => {
    expect(
      shouldEnforceProfileCompletion({
        capability: 'portal.hub',
        profileCompleted: false,
        hasCompletedOnlineExam: false,
      }),
    ).toBe(false);
    expect(
      shouldEnforceProfileCompletion({
        capability: 'exam.view_result',
        profileCompleted: false,
        hasCompletedOnlineExam: false,
      }),
    ).toBe(false);
  });

  it('PO-D30 — sau ≥1 bài: ép hub/results khi hồ sơ thiếu', () => {
    expect(
      shouldEnforceProfileCompletion({
        capability: 'portal.hub',
        profileCompleted: false,
        hasCompletedOnlineExam: true,
      }),
    ).toBe(true);
    expect(
      shouldEnforceProfileCompletion({
        capability: 'exam.start',
        profileCompleted: false,
        hasCompletedOnlineExam: true,
      }),
    ).toBe(false);
  });
});

export type PortalMockTestCapability =
  | 'exam.start'
  | 'exam.resume'
  | 'exam.offline.register'
  | 'exam.view_result'
  | 'portal.dashboard'
  | 'portal.hub';

/**
 * Runtime thi được phép khi hồ sơ chưa hoàn tất (bài đầu).
 * Hub / dashboard / results / offline: chỉ ép sau ≥1 bài (PO-D30).
 */
const CAPABILITIES_ALLOWED_WITH_INCOMPLETE_PROFILE =
  new Set<PortalMockTestCapability>(['exam.start', 'exam.resume']);

/** Capability có thể yêu cầu hồ sơ đủ (trừ khi chưa hoàn thành bài nào). */
export function requiresCompletedLeadProfile(
  capability: PortalMockTestCapability,
): boolean {
  return !CAPABILITIES_ALLOWED_WITH_INCOMPLETE_PROFILE.has(capability);
}

/**
 * PO-D30: bài đầu được thiếu hồ sơ; sau ≥1 bài xong mới ép complete-profile
 * cho hub / results / offline / dashboard.
 */
export function shouldEnforceProfileCompletion(input: {
  capability: PortalMockTestCapability;
  profileCompleted: boolean;
  hasCompletedOnlineExam: boolean;
}): boolean {
  if (input.profileCompleted) return false;
  if (!requiresCompletedLeadProfile(input.capability)) return false;
  return input.hasCompletedOnlineExam;
}

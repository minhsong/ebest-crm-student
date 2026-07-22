export type PortalMockTestCapability =
  | 'exam.start'
  | 'exam.resume'
  | 'exam.offline.register'
  | 'exam.view_result'
  | 'portal.dashboard'
  | 'portal.hub';

/** Runtime thi được phép khi hồ sơ chưa hoàn tất; hub/dashboard/results fail-closed (PO-D19). */
const CAPABILITIES_ALLOWED_WITH_INCOMPLETE_PROFILE =
  new Set<PortalMockTestCapability>(['exam.start', 'exam.resume']);

/** Policy thuần: runtime thi độc lập với gate hồ sơ; portal/results/hub vẫn fail-closed. */
export function requiresCompletedLeadProfile(
  capability: PortalMockTestCapability,
): boolean {
  return !CAPABILITIES_ALLOWED_WITH_INCOMPLETE_PROFILE.has(capability);
}

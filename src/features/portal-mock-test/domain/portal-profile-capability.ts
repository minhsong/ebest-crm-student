export type PortalMockTestCapability =
  | 'exam.start'
  | 'exam.resume'
  | 'exam.offline.register'
  | 'exam.view_result'
  | 'portal.dashboard'
  | 'portal.hub';

const CAPABILITIES_ALLOWED_WITH_INCOMPLETE_PROFILE =
  new Set<PortalMockTestCapability>([
    'exam.start',
    'exam.resume',
    'portal.hub',
  ]);

/** Policy thuần: runtime thi độc lập với gate hồ sơ; portal/results vẫn fail-closed. */
export function requiresCompletedLeadProfile(
  capability: PortalMockTestCapability,
): boolean {
  return !CAPABILITIES_ALLOWED_WITH_INCOMPLETE_PROFILE.has(capability);
}

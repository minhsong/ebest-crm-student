/**
 * Subset of public system settings used on the student portal (Google Sign-In).
 */

export function parseStudentPortalGoogleFromPublic(
  payload: Record<string, unknown> | null | undefined
): { enabled: boolean; clientId: string } {
  if (!payload) return { enabled: false, clientId: '' };
  const raw = payload.student_portal_google;
  if (!raw || typeof raw !== 'object') return { enabled: false, clientId: '' };
  const o = raw as Record<string, unknown>;
  return {
    enabled: o.enabled === true,
    clientId: typeof o.clientId === 'string' ? o.clientId.trim() : '',
  };
}

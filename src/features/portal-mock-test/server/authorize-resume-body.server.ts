import { stripClientIdentityClaims } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';

/**
 * Client không được tự claim omniLeadId. BFF chỉ inject identity đã resolve
 * từ HttpOnly portal session; guest chỉ có thể resume bằng examSessionToken.
 */
export function buildAuthorizeResumeBody(
  body: Record<string, unknown>,
  serverOmniLeadId?: string | null,
): Record<string, unknown> {
  const safe = stripClientIdentityClaims(body);
  const omniLeadId = serverOmniLeadId?.trim();
  return omniLeadId ? { ...safe, omniLeadId } : safe;
}

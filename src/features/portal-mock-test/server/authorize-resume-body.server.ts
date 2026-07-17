/**
 * Client không được tự claim omniLeadId. BFF chỉ inject identity đã resolve
 * từ HttpOnly portal session; guest chỉ có thể resume bằng examSessionToken.
 */
export function buildAuthorizeResumeBody(
  body: Record<string, unknown>,
  serverOmniLeadId?: string | null,
): Record<string, unknown> {
  const safe = { ...body };
  delete safe.omniLeadId;
  const omniLeadId = serverOmniLeadId?.trim();
  return omniLeadId ? { ...safe, omniLeadId } : safe;
}

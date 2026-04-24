/** Cùng shape với AuthCustomer — tránh import vòng auth-context. */
export type GoogleSessionCustomerSummary = {
  id: number;
  fullName: string;
  primaryEmail?: string;
  primaryPhone?: string;
};

export type ParsedGoogleLoginPayload =
  | {
      kind: 'complete_profile';
      completeProfileUrl: string;
      reason: 'needs_password' | 'incomplete_profile';
    }
  | {
      kind: 'session';
      customer: GoogleSessionCustomerSummary;
    }
  | { kind: 'invalid' };

/**
 * Parse body đã unwrap (`result` / `data`) từ POST auth/google/login.
 */
export function parseGoogleLoginPayload(
  payload: unknown,
): ParsedGoogleLoginPayload {
  if (!payload || typeof payload !== 'object') {
    return { kind: 'invalid' };
  }
  const p = payload as Record<string, unknown>;
  if (
    p.flow === 'complete_profile' &&
    typeof p.completeProfileUrl === 'string' &&
    p.completeProfileUrl.trim()
  ) {
    const reason: 'needs_password' | 'incomplete_profile' =
      p.reason === 'needs_password' ? 'needs_password' : 'incomplete_profile';
    return {
      kind: 'complete_profile',
      completeProfileUrl: p.completeProfileUrl.trim(),
      reason,
    };
  }
  const raw = p.customer;
  if (!raw || typeof raw !== 'object') {
    return { kind: 'invalid' };
  }
  const c = raw as Record<string, unknown>;
  const id = c.id;
  const fullName = c.fullName;
  if (typeof id !== 'number' || typeof fullName !== 'string') {
    return { kind: 'invalid' };
  }
  const customer: GoogleSessionCustomerSummary = {
    id,
    fullName: fullName || 'Học viên',
    primaryEmail:
      typeof c.primaryEmail === 'string' ? c.primaryEmail : undefined,
    primaryPhone:
      typeof c.primaryPhone === 'string' ? c.primaryPhone : undefined,
  };
  return { kind: 'session', customer };
}

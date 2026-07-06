/**
 * Map CRM portal email conflict → client-safe payload (PI-D16, BL-Q7).
 */

import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';

export const PORTAL_EMAIL_CONFLICT_MESSAGE =
  'Thông tin email không hợp lệ hoặc đã tồn tại trong hệ thống. Vui lòng kiểm tra lại, đăng nhập nếu bạn đã có tài khoản, hoặc liên hệ Fanpage Ebest để được hỗ trợ.';

export type PortalConflictClientAction = 'login' | 'contact_support';

export type PortalConflictClientPayload = {
  message: string;
  code?: string;
  action?: PortalConflictClientAction;
};

function isPortalEmailConflictPayload(o: Record<string, unknown>): boolean {
  const code = typeof o.code === 'string' ? o.code : '';
  if (
    code === 'PORTAL_EMAIL_ALREADY_REGISTERED' ||
    code === 'DUPLICATE_EMAIL' ||
    code === 'EMAIL_ALREADY_IN_SYSTEM'
  ) {
    return true;
  }
  const conflict = o.conflict;
  return conflict != null && typeof conflict === 'object' && !Array.isArray(conflict);
}

/** CRM conflict / pre-check → client; các status khác fallback sanitize. */
export function mapPortalConflictForClient(
  data: unknown,
  status: number,
  fallback?: string,
): PortalConflictClientPayload {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const isConflictStatus = status === 409 || status === 401;
    if (isConflictStatus && isPortalEmailConflictPayload(o)) {
      const conflict = o.conflict as Record<string, unknown> | undefined;
      const conflictType =
        typeof conflict?.type === 'string' ? conflict.type : undefined;
      const action: PortalConflictClientAction =
        conflictType === 'customer_profile' ? 'contact_support' : 'login';
      return {
        message: PORTAL_EMAIL_CONFLICT_MESSAGE,
        code: 'EMAIL_ALREADY_IN_SYSTEM',
        action,
      };
    }
  }
  return sanitizeApiErrorPayload(data, status, fallback);
}

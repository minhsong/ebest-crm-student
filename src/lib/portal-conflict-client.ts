/**
 * Map CRM / Gateway portal contact conflict → client-safe payload (PI-D16, BL-Q7).
 */

import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';

export const PORTAL_EMAIL_CONFLICT_MESSAGE =
  'Email này đã có trong hệ thống. Vui lòng đăng nhập bằng tài khoản hiện có, dùng email khác hoặc liên hệ Ebest để được hỗ trợ.';

export const PORTAL_PHONE_CONFLICT_MESSAGE =
  'Số điện thoại này đã có trong hệ thống. Vui lòng đăng nhập bằng tài khoản hiện có, dùng số khác hoặc liên hệ Ebest để được hỗ trợ.';

export const PORTAL_INTAKE_UNAVAILABLE_MESSAGE =
  'Hiện chưa đăng ký được do sự cố tạm thời. Vui lòng thử lại sau vài phút. Nếu vẫn lỗi, liên hệ Fanpage Ebest để được hỗ trợ.';

export type PortalConflictClientAction = 'login' | 'contact_support' | 'retry';

export type PortalConflictClientPayload = {
  message: string;
  code?: string;
  errorCode?: string;
  action?: PortalConflictClientAction;
  retryAfterSec?: number;
};

const EMAIL_CONFLICT_CODES = new Set([
  'PORTAL_EMAIL_ALREADY_REGISTERED',
  'DUPLICATE_EMAIL',
  'EMAIL_ALREADY_IN_SYSTEM',
]);

const PHONE_CONFLICT_CODES = new Set([
  'PORTAL_PHONE_ALREADY_REGISTERED',
  'PHONE_ALREADY_IN_SYSTEM',
]);

const CONTACT_CONFLICT_CODES = new Set([
  ...EMAIL_CONFLICT_CODES,
  ...PHONE_CONFLICT_CODES,
  'CONTACT_ALREADY_REGISTERED',
]);

function readSemanticCode(o: Record<string, unknown>): string {
  for (const key of ['errorCode', 'code'] as const) {
    const raw = o[key];
    if (typeof raw === 'string' && /^[A-Z][A-Z0-9_]*$/.test(raw.trim())) {
      return raw.trim();
    }
  }
  return '';
}

function isPortalContactConflictPayload(o: Record<string, unknown>): boolean {
  const code = readSemanticCode(o);
  if (CONTACT_CONFLICT_CODES.has(code)) return true;
  const conflict = o.conflict;
  return conflict != null && typeof conflict === 'object' && !Array.isArray(conflict);
}

/** CRM conflict / pre-check / intake → client; các status khác fallback sanitize. */
export function mapPortalConflictForClient(
  data: unknown,
  status: number,
  fallback?: string,
): PortalConflictClientPayload {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const semantic = readSemanticCode(o);

    if (semantic === 'INTAKE_TEMPORARILY_UNAVAILABLE') {
      return {
        message: PORTAL_INTAKE_UNAVAILABLE_MESSAGE,
        code: 'INTAKE_TEMPORARILY_UNAVAILABLE',
        errorCode: 'INTAKE_TEMPORARILY_UNAVAILABLE',
        action: 'retry',
      };
    }

    const isConflictStatus = status === 409 || status === 401;
    if (isConflictStatus && isPortalContactConflictPayload(o)) {
      const conflict = o.conflict as Record<string, unknown> | undefined;
      const conflictType =
        typeof conflict?.type === 'string' ? conflict.type : undefined;
      const actionFromBody =
        o.action === 'contact_support' || o.action === 'login'
          ? o.action
          : undefined;
      const isPhone = PHONE_CONFLICT_CODES.has(semantic);
      const action: PortalConflictClientAction =
        actionFromBody ??
        (conflictType === 'customer_profile' ? 'contact_support' : 'login');
      const clientCode = isPhone
        ? 'PHONE_ALREADY_IN_SYSTEM'
        : 'EMAIL_ALREADY_IN_SYSTEM';
      return {
        message: isPhone
          ? PORTAL_PHONE_CONFLICT_MESSAGE
          : PORTAL_EMAIL_CONFLICT_MESSAGE,
        code: clientCode,
        errorCode: semantic || clientCode,
        action,
      };
    }

    if (semantic === 'RATE_LIMITED' || status === 429) {
      const sanitized = sanitizeApiErrorPayload(
        data,
        status,
        'Bạn đã thao tác quá nhiều lần. Vui lòng đợi rồi thử lại.',
      );
      const retryAfterSec =
        typeof o.retryAfterSec === 'number' &&
        Number.isFinite(o.retryAfterSec) &&
        o.retryAfterSec > 0
          ? Math.round(o.retryAfterSec)
          : undefined;
      return {
        message: sanitized.message,
        code: 'RATE_LIMITED',
        errorCode: 'RATE_LIMITED',
        action: 'retry',
        ...(retryAfterSec != null ? { retryAfterSec } : {}),
      };
    }
  }

  const sanitized = sanitizeApiErrorPayload(data, status, fallback);
  return {
    ...sanitized,
    ...(sanitized.code ? { errorCode: sanitized.code } : {}),
  };
}

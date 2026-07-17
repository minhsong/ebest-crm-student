/**
 * Thông báo an toàn cho học viên — không lộ env, URL nội bộ, lệnh dev, tên service.
 * Chi tiết kỹ thuật ghi server log + relay CRM (xem reportStudentPortalBffError).
 */

import { reportStudentPortalBffError } from '@/lib/report-bff-error';

const TECHNICAL_MESSAGE_PATTERNS: RegExp[] = [
  /SOCIAL_GATEWAY|NEXT_PUBLIC_|CRM_API_URL|QUIZ_PORTAL/i,
  /localhost|127\.0\.0\.1|0\.0\.0\.0/i,
  /\bhttps?:\/\//i,
  /npm\s+run|node_modules|ebest-[a-z-]+/i,
  /\.env\b|SERVICE_TOKEN|BASE_URL/i,
  /\bGET\s+\/|\bPOST\s+\/|internal\/student/i,
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed/i,
  /Unsupported quiz-runtime|quiz-runtime path/i,
  /\bHTTP\s+\d{3}\b/i,
  /NestJS|MongoDB|TypeORM|mongoose/i,
  /Social Gateway|Gateway\b.*\b3040/i,
  /at\s+[\w.]+\s+\(/,
  /Exception|stack trace/i,
  /\b(entitlement|AccessEntitlement|grantId|grant TTL|AE-|MOCK_TEST_ENTITLEMENT)\b/i,
  /\b(examSessionToken|pendingRegistrationId|NEXT_PUBLIC_)\b/i,
  /\b(CRM intake|Phản hồi CRM|assert-mock-test-intake|portal_login_key)\b/i,
  // M7-5 — thuật ngữ nội bộ portal / identity (PI-D16)
  /\b(tài khoản lead|lead portal|lead account|portal account|customer credential)\b/i,
  /\b(omniLeadId|customerId|leadAccountId|lead_portal_account|login_key|loginKey)\b/i,
  /@mto\.ebest\.internal/i,
  /\b[0-9a-f]{24}\b/i,
  /\b(conflict\.type|suggestedAction|login_customer|login_lead)\b/i,
  /\b(omni_lead|customer_portal|lead_portal)\b/i,
  /\b(chuyển sang khách hàng|đăng nhập cổng học viên)\b/i,
];

const USER_MESSAGES = {
  generic: 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.',
  network:
    'Không thể kết nối với máy chủ. Hệ thống có thể đang bảo trì — vui lòng thử lại sau.',
  unauthorized: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  notFound: 'Không tìm thấy dữ liệu yêu cầu.',
  serverConfig:
    'Hệ thống tạm thời chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ Fanpage / hỗ trợ Ebest.',
  quizUnavailable:
    'Không thể mở bài làm trực tuyến lúc này. Vui lòng thử lại sau.',
  quizLoadFailed: 'Không tải được đề hoặc phiên làm bài. Vui lòng thử lại.',
  quizSubmitFailed: 'Không nộp được bài. Vui lòng thử lại.',
  wsUnavailable:
    'Không kết nối được phiên làm bài thời gian thực. Vui lòng tải lại trang.',
} as const;

/** Copy đầy đủ cho màn lỗi kết nối (error boundary / RootLayout). */
export const PORTAL_SERVER_UNAVAILABLE_COPY = {
  title: 'Không kết nối được với máy chủ',
  description:
    'Hệ thống có thể đang được bảo trì hoặc tạm thời gián đoạn. Vui lòng thử lại sau ít phút.',
  supportHint:
    'Nếu cần hỗ trợ, vui lòng liên hệ trực tiếp Fanpage hoặc kênh hỗ trợ của Ebest.',
} as const;

const CONNECTION_CAUSE_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function readErrorCauseCode(error: unknown): string {
  if (!(error instanceof Error) || !error.cause || typeof error.cause !== 'object') {
    return '';
  }
  const code = (error.cause as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

/** Nhận diện lỗi mạng / upstream chết (Node `fetch failed`, ECONNREFUSED, …). */
export function isUpstreamConnectionFailure(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'string') {
    return /fetch failed|Failed to fetch|NetworkError|ECONNREFUSED|ETIMEDOUT/i.test(
      error,
    );
  }
  if (!(error instanceof Error)) return false;
  const message = error.message || '';
  if (
    /fetch failed|Failed to fetch|NetworkError|network error|ECONNREFUSED|ETIMEDOUT/i.test(
      message,
    )
  ) {
    return true;
  }
  const causeCode = readErrorCauseCode(error);
  if (causeCode && CONNECTION_CAUSE_CODES.has(causeCode)) return true;
  if (error.name === 'TypeError' && /fetch/i.test(message)) return true;
  return false;
}

export type StudentSafeErrorKey = keyof typeof USER_MESSAGES;

export function isTechnicalStudentMessage(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  if (t.length > 280) return true;
  return TECHNICAL_MESSAGE_PATTERNS.some((re) => re.test(t));
}

/** Chọn thông báo hiển thị; message nghiệp vụ (tiếng Việt) được giữ nếu không “technical”. */
export function sanitizeStudentFacingMessage(
  raw: string | undefined | null,
  fallback: string = USER_MESSAGES.generic,
): string {
  if (raw == null) return fallback;
  const t = String(raw).trim();
  if (!t || isTechnicalStudentMessage(t)) return fallback;
  return t;
}

export function studentMessageForHttpStatus(status: number): string {
  if (status === 401) return USER_MESSAGES.unauthorized;
  if (status === 403) return USER_MESSAGES.forbidden;
  if (status === 404) return USER_MESSAGES.notFound;
  if (status === 503 || status === 502 || status === 504) {
    return USER_MESSAGES.network;
  }
  if (status >= 500) return USER_MESSAGES.serverConfig;
  return USER_MESSAGES.generic;
}

/** JSON trả về client từ BFF — lỗi chỉ còn `{ message }` an toàn (+ `code` nghiệp vụ nếu có). */
export function sanitizeApiErrorPayload(
  data: unknown,
  status: number,
  fallback?: string,
): { message: string; code?: string } {
  const base = fallback ?? studentMessageForHttpStatus(status);
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const raw =
      typeof o.message === 'string'
        ? o.message
        : typeof o.error === 'string'
          ? o.error
          : undefined;
    const code =
      typeof o.code === 'string' && /^[A-Z0-9_]+$/.test(o.code)
        ? o.code
        : typeof o.errorCode === 'string' && /^[A-Z0-9_]+$/.test(o.errorCode)
          ? o.errorCode
          : undefined;
    return {
      message: sanitizeStudentFacingMessage(raw, base),
      ...(code ? { code } : {}),
    };
  }
  return { message: base };
}

export function logInternalApiError(
  context: string,
  detail: unknown,
  options?: {
    customerId?: number;
    path?: string;
    method?: string;
    errorType?: string;
  },
): void {
  if (process.env.NODE_ENV === 'production') {
    const brief =
      detail instanceof Error
        ? detail.message
        : typeof detail === 'string'
          ? detail
          : JSON.stringify(detail);
    console.error(`[student-portal] ${context}: ${brief}`);
  } else {
    console.error(`[student-portal] ${context}`, detail);
  }
  reportStudentPortalBffError(context, detail, options);
}

export { USER_MESSAGES as STUDENT_SAFE_USER_MESSAGES };

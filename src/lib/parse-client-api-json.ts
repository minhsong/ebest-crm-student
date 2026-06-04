import {
  sanitizeStudentFacingMessage,
  studentMessageForHttpStatus,
} from '@/lib/student-safe-errors';

/**
 * Parse message an toàn từ response JSON của API route nội bộ (đã unwrap giống CRM).
 */
export function getMessageFromClientApiJson(
  data: unknown,
  httpStatus?: number,
): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  const fallback =
    httpStatus != null
      ? studentMessageForHttpStatus(httpStatus)
      : undefined;
  if (typeof o.message === 'string' && o.message.trim()) {
    return sanitizeStudentFacingMessage(
      o.message,
      fallback ?? 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.',
    );
  }
  const inner = o.result ?? o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const m = (inner as Record<string, unknown>).message;
    if (typeof m === 'string' && m.trim()) {
      return sanitizeStudentFacingMessage(
        m,
        fallback ?? 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.',
      );
    }
  }
  return undefined;
}

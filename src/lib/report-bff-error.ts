/**
 * Relay lỗi BFF server-side lên CRM → log platform (service=student-portal).
 * Fire-and-forget — không block response học viên.
 */

const REPORT_PATH = '/api/v1/student/internal/bff-errors';
const HEADER = 'X-Student-Portal-Bff-Key';

export type ReportBffErrorInput = {
  context: string;
  message: string;
  errorType?: string;
  stack?: string;
  customerId?: number;
  path?: string;
  method?: string;
  details?: Record<string, unknown>;
};

function getCrmBaseUrl(): string | null {
  const url = process.env.CRM_API_URL?.trim();
  return url || null;
}

function getReportKey(): string | null {
  const key = process.env.STUDENT_PORTAL_BFF_REPORT_KEY?.trim();
  return key || null;
}

function briefMessage(detail: unknown): string {
  if (detail instanceof Error) return detail.message.slice(0, 2000);
  if (typeof detail === 'string') return detail.slice(0, 2000);
  try {
    return JSON.stringify(detail).slice(0, 2000);
  } catch {
    return 'Unknown error';
  }
}

function stackFromDetail(detail: unknown): string | undefined {
  if (process.env.NODE_ENV === 'production') return undefined;
  if (detail instanceof Error && detail.stack) {
    return detail.stack.slice(0, 8000);
  }
  return undefined;
}

/** Gửi lỗi lên CRM (noop khi thiếu env). */
export function reportStudentPortalBffError(
  context: string,
  detail: unknown,
  options?: {
    customerId?: number;
    path?: string;
    method?: string;
    errorType?: string;
    details?: Record<string, unknown>;
  },
): void {
  const baseUrl = getCrmBaseUrl();
  const reportKey = getReportKey();
  if (!baseUrl || !reportKey) return;

  const payload: ReportBffErrorInput = {
    context,
    message: briefMessage(detail),
    errorType: options?.errorType,
    stack: stackFromDetail(detail),
    customerId: options?.customerId,
    path: options?.path,
    method: options?.method,
    details: options?.details,
  };

  const url = `${baseUrl.replace(/\/$/, '')}${REPORT_PATH}`;

  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [HEADER]: reportKey,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* swallow — đã log console qua logInternalApiError */
  });
}

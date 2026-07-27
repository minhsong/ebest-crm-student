/**
 * Relay lỗi BFF server-side lên CRM → log platform (service=student-portal).
 * Fire-and-forget — không block response học viên.
 * Auth: Bearer `CRM_SERVICE_KEY` (cùng inbound key mọi internal CRM).
 */

import { resolveCrmServiceKey } from '@/lib/service-keys';

const REPORT_PATH = '/api/v1/student/internal/bff-errors';

export type ReportBffErrorInput = {
  context: string;
  message: string;
  errorType?: string;
  stack?: string;
  customerId?: number;
  path?: string;
  method?: string;
  /** Portal / caller request id — correlate log platform. */
  requestId?: string;
  details?: Record<string, unknown>;
};

function getCrmBaseUrl(): string | null {
  const url = process.env.CRM_API_URL?.trim();
  return url || null;
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
  if (detail instanceof Error && detail.stack) {
    return detail.stack.slice(0, 8000);
  }
  return undefined;
}

/** Gửi lỗi lên CRM (noop khi thiếu env). Log rõ khi relay fail — trước đây nuốt im. */
export function reportStudentPortalBffError(
  context: string,
  detail: unknown,
  options?: {
    customerId?: number;
    path?: string;
    method?: string;
    errorType?: string;
    requestId?: string;
    details?: Record<string, unknown>;
  },
): void {
  const baseUrl = getCrmBaseUrl();
  const serviceKey = resolveCrmServiceKey();
  if (!baseUrl || !serviceKey) {
    console.warn(
      JSON.stringify({
        event: 'portal.bff_error_relay.skipped',
        context,
        reason: !baseUrl ? 'CRM_API_URL_missing' : 'CRM_SERVICE_KEY_missing',
      }),
    );
    return;
  }

  const requestId =
    options?.requestId?.trim() ||
    (typeof options?.details?.requestId === 'string'
      ? options.details.requestId
      : undefined);

  const payload: ReportBffErrorInput = {
    context,
    message: briefMessage(detail),
    errorType: options?.errorType,
    stack: stackFromDetail(detail),
    customerId: options?.customerId,
    path: options?.path,
    method: options?.method,
    requestId,
    details: {
      ...(options?.details ?? {}),
      ...(requestId ? { requestId } : {}),
    },
  };

  const url = `${baseUrl.replace(/\/$/, '')}${REPORT_PATH}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${serviceKey}`,
  };
  const legacyReport = process.env.STUDENT_PORTAL_BFF_REPORT_KEY?.trim();
  if (legacyReport) {
    headers['X-Student-Portal-Bff-Key'] = legacyReport;
  } else {
    headers['X-Student-Portal-Bff-Key'] = serviceKey;
  }

  void fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.ok || res.status === 204) return;
      console.warn(
        JSON.stringify({
          event: 'portal.bff_error_relay.http_error',
          context,
          status: res.status,
          url,
          requestId: requestId ?? null,
        }),
      );
    })
    .catch((err) => {
      console.warn(
        JSON.stringify({
          event: 'portal.bff_error_relay.fetch_failed',
          context,
          url,
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    });
}

/**
 * Chi tiết lỗi mock-test trên UI (phase test / pilot).
 * Bật: NEXT_PUBLIC_MOCK_TEST_SHOW_ERROR_DETAILS=true
 *   hoặc NEXT_PUBLIC_MOCK_TEST_ONLINE_DEBUG=true
 *   hoặc NODE_ENV !== production
 */

export type MockTestErrorDiagnostics = {
  /** Mã ngắn (digest Next, errorCode Gateway, …) */
  code?: string;
  /** Portal / BFF request id — correlate log platform */
  requestId?: string;
  /** Message gốc (có thể technical) */
  rawMessage?: string;
  /** Tên Error / loại */
  errorName?: string;
  /** Path / step */
  path?: string;
  /** HTTP status nếu có */
  httpStatus?: number;
  /** Timestamp ISO */
  occurredAt?: string;
  /** Stack / componentStack (rút gọn) */
  stack?: string;
  /** Ghi chú thêm */
  extra?: Record<string, string | number | boolean | null | undefined>;
};

export function isMockTestErrorDetailsEnabled(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_MOCK_TEST_SHOW_ERROR_DETAILS === 'true') {
    return true;
  }
  if (process.env.NEXT_PUBLIC_MOCK_TEST_ONLINE_DEBUG === 'true') {
    return true;
  }
  // Server-only companion
  if (
    typeof window === 'undefined' &&
    process.env.MOCK_TEST_ONLINE_DEBUG === 'true'
  ) {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

/** Server BFF: có đính `detail` vào JSON lỗi cho client test. */
export function isMockTestBffErrorDetailsEnabled(): boolean {
  return (
    process.env.MOCK_TEST_ONLINE_DEBUG === 'true' ||
    process.env.NEXT_PUBLIC_MOCK_TEST_SHOW_ERROR_DETAILS === 'true' ||
    process.env.NEXT_PUBLIC_MOCK_TEST_ONLINE_DEBUG === 'true' ||
    process.env.NODE_ENV !== 'production'
  );
}

export function briefErrorDetail(detail: unknown, max = 2000): string {
  if (detail instanceof Error) {
    const parts = [detail.name, detail.message];
    if (detail.stack) parts.push(detail.stack.slice(0, 1500));
    return parts.filter(Boolean).join('\n').slice(0, max);
  }
  if (typeof detail === 'string') return detail.slice(0, max);
  try {
    return JSON.stringify(detail).slice(0, max);
  } catch {
    return String(detail).slice(0, max);
  }
}

export function formatMockTestErrorDiagnostics(
  d: MockTestErrorDiagnostics,
): string {
  const lines: string[] = [
    '=== Ebest Mock Test — báo cáo lỗi (copy gửi hỗ trợ) ===',
    `Thời gian: ${d.occurredAt ?? new Date().toISOString()}`,
  ];
  if (d.path) lines.push(`Đường dẫn / bước: ${d.path}`);
  if (d.code) lines.push(`Mã: ${d.code}`);
  if (d.requestId) lines.push(`RequestId: ${d.requestId}`);
  if (d.errorName) lines.push(`Loại: ${d.errorName}`);
  if (d.httpStatus != null) lines.push(`HTTP: ${d.httpStatus}`);
  if (d.rawMessage) lines.push(`Message: ${d.rawMessage}`);
  if (d.extra) {
    for (const [k, v] of Object.entries(d.extra)) {
      if (v === undefined) continue;
      lines.push(`${k}: ${String(v)}`);
    }
  }
  if (d.stack) {
    lines.push('--- Stack (rút gọn) ---');
    lines.push(d.stack.slice(0, 2500));
  }
  lines.push('=== hết ===');
  return lines.join('\n');
}

export function diagnosticsFromUnknownError(
  error: unknown,
  options?: { path?: string; httpStatus?: number },
): MockTestErrorDiagnostics {
  const occurredAt = new Date().toISOString();
  const path =
    options?.path ??
    (typeof window !== 'undefined' ? window.location.pathname : undefined);

  if (error instanceof Error) {
    const digest =
      'digest' in error && typeof (error as { digest?: string }).digest === 'string'
        ? (error as { digest: string }).digest
        : undefined;
    return {
      code: digest,
      rawMessage: error.message,
      errorName: error.name,
      path,
      httpStatus: options?.httpStatus,
      occurredAt,
      stack: error.stack?.slice(0, 2500),
    };
  }

  return {
    rawMessage: briefErrorDetail(error, 800),
    path,
    httpStatus: options?.httpStatus,
    occurredAt,
  };
}

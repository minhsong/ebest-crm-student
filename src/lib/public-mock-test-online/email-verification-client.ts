export type RequestEmailVerificationResult = {
  sent: boolean;
  message?: string;
};

/** Gửi / gửi lại email xác nhận K2 cho registration online. */
export async function requestMockTestOnlineEmailVerification(
  registrationId: number,
): Promise<RequestEmailVerificationResult> {
  const res = await fetch('/api/public/mock-test-online/request-email-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    sent?: boolean;
  };
  if (!res.ok) {
    throw new Error(data.message ?? 'Không gửi được email xác nhận.');
  }
  return { sent: data.sent !== false, message: data.message };
}

export function emailVerificationHintFromResult(
  result: RequestEmailVerificationResult,
): string {
  if (result.sent === false) {
    return 'Email đã được xác nhận trước đó hoặc không cần gửi lại.';
  }
  return 'Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư (kể cả Spam) để nhận kết quả sau khi thi.';
}

'use client';

import { useEffect, useState } from 'react';
import { fetchMockTestPostExamDestination } from '@/lib/public-mock-test-online/mock-test-online-api.client';

export type EmailVerificationStatus = 'idle' | 'loading' | 'ok' | 'error';

export type EmailVerificationResult = {
  status: EmailVerificationStatus;
  message: string;
  sessionReady: boolean;
  email: string | null;
  nextPath: string;
};

/**
 * Xác nhận email funnel mock test online — tách logic khỏi UI.
 */
export function useConfirmEmailVerification(token: string): EmailVerificationResult {
  const [status, setStatus] = useState<EmailVerificationStatus>('idle');
  const [message, setMessage] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState(
    '/login?returnUrl=%2Fmock-test%2Fresults',
  );

  useEffect(() => {
    const trimmed = token.trim();
    if (!trimmed) {
      setStatus('error');
      setMessage('Liên kết xác nhận không hợp lệ.');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    void (async () => {
      try {
        const res = await fetch('/api/public/mock-test-online/confirm-email-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: trimmed }),
        });
        const data = (await res.json()) as {
          message?: string;
          email?: string;
          sessionReady?: boolean;
        };
        if (!res.ok) {
          throw new Error(data.message ?? 'Xác nhận thất bại.');
        }
        if (cancelled) return;
        const verifiedEmail = data.email?.trim() || null;
        setEmail(verifiedEmail);
        setSessionReady(Boolean(data.sessionReady));
        const destination = await fetchMockTestPostExamDestination().catch(
          () => null,
        );
        if (cancelled) return;
        if (destination) setNextPath(destination.nextPath);
        setStatus('ok');
        setMessage(
          verifiedEmail
            ? `Email ${verifiedEmail} đã được xác nhận.${
                data.sessionReady
                  ? ' Bạn đã được đăng nhập — có thể xem kết quả sau khi hoàn thành bài thi.'
                  : ' Kết quả sẽ gửi tới địa chỉ này sau khi bạn hoàn thành bài thi.'
              }`
            : 'Xác nhận email thành công.',
        );
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e instanceof Error ? e.message : 'Xác nhận thất bại.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { status, message, sessionReady, email, nextPath };
}

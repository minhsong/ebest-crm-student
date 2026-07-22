'use client';

import { Suspense, useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeadPortalShell } from '@/components/lead-portal/LeadPortalShell';

function LeadMtoResumeConsumeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token.trim()) {
      setError(
        'Thiếu liên kết hợp lệ. Hãy yêu cầu gửi lại từ trang đăng ký thi thử.',
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/lead/mto-resume/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
          nextPath?: string;
          kind?: 'lead_session' | 'omni_funnel';
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(
            typeof data.message === 'string' && data.message.trim()
              ? data.message
              : 'Liên kết không hợp lệ hoặc đã hết hạn.',
          );
          return;
        }
        const next =
          typeof data.nextPath === 'string' && data.nextPath.trim()
            ? data.nextPath
            : data.kind === 'omni_funnel'
              ? '/mock-test-online/select-exam'
              : '/mock-test';
        router.replace(next);
      } catch {
        if (!cancelled) {
          setError('Không thể xác nhận liên kết. Vui lòng thử lại.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <LeadPortalShell
      title="Tiếp tục đăng ký"
      description="Đang xác nhận liên kết email…"
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          message="Không thể tiếp tục"
          description={
            <>
              {error}{' '}
              <Link href="/mock-test-online" className="text-blue-600">
                Quay lại đăng ký thi thử
              </Link>
              .
            </>
          }
        />
      ) : (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      )}
    </LeadPortalShell>
  );
}

/** Trang consume magic link MTO — set session rồi redirect complete-profile / dashboard. */
export function LeadMtoResumeClient() {
  return (
    <Suspense
      fallback={
        <LeadPortalShell title="Tiếp tục đăng ký">
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        </LeadPortalShell>
      }
    >
      <LeadMtoResumeConsumeInner />
    </Suspense>
  );
}

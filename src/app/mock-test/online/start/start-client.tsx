'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Result, Spin } from 'antd';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import {
  sanitizeStudentFacingMessage,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import { reportMockTestClientError } from '@/lib/public-mock-test-online/report-mock-test-client-error';

type BootstrapJson =
  | { ok: true; redirectTo: string; traceId: string }
  | { ok: false; error: string; traceId: string | null; debug?: string };

/**
 * Màn "đang chuẩn bị" — gọi Route Handler POST (không Server Action).
 * Network tab thấy JSON thật; CRM nhận MTO_BOOTSTRAP_SERVER_ERROR nếu server throw.
 */
export function PortalMockTestOnlineStartClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    startTransition(() => {
      void (async () => {
        let traceId: string | null = null;
        try {
          const res = await fetch('/api/mock-test/bootstrap-online', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
          });

          const text = await res.text();
          let data: BootstrapJson | null = null;
          try {
            data = JSON.parse(text) as BootstrapJson;
          } catch {
            reportMockTestClientError({
              context: 'mto.online-start.bootstrap-non-json',
              message: `HTTP ${res.status}; body=${text.slice(0, 300)}`,
              path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
              module: 'mto-online-start',
              stack: text.slice(0, 2000),
            });
            if (active) {
              setError(STUDENT_SAFE_USER_MESSAGES.generic);
            }
            return;
          }

          if (data && 'traceId' in data && data.traceId) {
            traceId = data.traceId;
          }

          if (!active) return;

          if (data && data.ok === true && data.redirectTo) {
            router.replace(data.redirectTo);
            return;
          }

          if (data && data.ok === false) {
            reportMockTestClientError({
              context: 'mto.online-start.bootstrap-returned-error',
              message: data.error,
              path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
              module: 'mto-online-start',
              requestId: traceId ?? undefined,
              stack: data.debug,
            });
            setError(data.error);
            return;
          }

          reportMockTestClientError({
            context: 'mto.online-start.bootstrap-unexpected-shape',
            message: `HTTP ${res.status}; ${text.slice(0, 300)}`,
            path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
            module: 'mto-online-start',
            requestId: traceId ?? undefined,
          });
          setError(STUDENT_SAFE_USER_MESSAGES.generic);
        } catch (e) {
          const rawMessage =
            e instanceof Error ? e.message : 'bootstrap_fetch_threw';
          reportMockTestClientError({
            context: 'mto.online-start.bootstrap-fetch-threw',
            message: rawMessage,
            path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
            module: 'mto-online-start',
            requestId: traceId ?? undefined,
            stack: e instanceof Error ? e.stack : undefined,
          });
          if (active) {
            setError(
              sanitizeStudentFacingMessage(
                e instanceof Error ? e.message : undefined,
                STUDENT_SAFE_USER_MESSAGES.generic,
              ),
            );
          }
        }
      })();
    });
    return () => {
      active = false;
    };
  }, [attempt, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Result
          status="warning"
          title="Không khởi tạo được phiên thi"
          subTitle={error}
          extra={[
            <Button
              key="retry"
              type="primary"
              onClick={() => {
                setError(null);
                setAttempt((n) => n + 1);
              }}
            >
              Thử lại
            </Button>,
            <Link key="hub" href={PORTAL_MOCK_TEST_ROUTES.hub}>
              <Button>Về Thi thử</Button>
            </Link>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Spin size="large" />
      <p className="text-base text-gray-600">Đang chuẩn bị phòng thi…</p>
    </div>
  );
}

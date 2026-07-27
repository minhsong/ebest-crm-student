'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, Result, Spin } from 'antd';
import {
  startPortalOnlineBootstrapAction,
  type StartOnlineBootstrapState,
} from '@/features/portal-mock-test/server/start-online-bootstrap.action';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { isNextNavigationError } from '@/lib/next-navigation-errors';
import {
  sanitizeStudentFacingMessage,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import { reportMockTestClientError } from '@/lib/public-mock-test-online/report-mock-test-client-error';

/** Màn "đang chuẩn bị" — tự kích Server Action bootstrap (POST). */
export function PortalMockTestOnlineStartClient() {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    startTransition(() => {
      void (async () => {
        try {
          const res: StartOnlineBootstrapState =
            await startPortalOnlineBootstrapAction();
          if (active && res?.error) {
            reportMockTestClientError({
              context: 'mto.online-start.action-returned-error',
              message: res.error,
              path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
              module: 'mto-online-start',
            });
            setError(res.error);
          }
        } catch (e) {
          // Redirect / notFound phải bubble — Next xử lý navigation.
          if (isNextNavigationError(e)) throw e;

          const digest =
            e &&
            typeof e === 'object' &&
            'digest' in e &&
            typeof (e as { digest?: unknown }).digest !== 'undefined'
              ? String((e as { digest?: unknown }).digest)
              : undefined;

          const rawMessage =
            e instanceof Error ? e.message : 'server_action_threw';
          reportMockTestClientError({
            context: 'mto.online-start.action-http-or-throw',
            message: rawMessage,
            digest,
            path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
            // Next production error (Server Components render) thường chỉ có digest
            // mà không có stack trên client; dùng digest làm fallback cho UI.
            stack:
              e instanceof Error && e.stack?.trim()
                ? e.stack
                : digest
                  ? digest
                  : undefined,
            module: 'mto-online-start',
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
  }, [attempt]);

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

'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, Result, Spin } from 'antd';
import {
  startPortalOnlineBootstrapAction,
  type StartOnlineBootstrapState,
} from '@/features/portal-mock-test/server/start-online-bootstrap.action';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/** Màn "đang chuẩn bị" — tự kích Server Action bootstrap (POST). */
export function PortalMockTestOnlineStartClient() {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      const res: StartOnlineBootstrapState =
        await startPortalOnlineBootstrapAction();
      if (active && res?.error) setError(res.error);
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

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Result, Spin } from 'antd';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { useConfirmEmailVerification } from '@/features/mock-test-portal/hooks/useConfirmEmailVerification';
import { PORTAL_LOGIN_PATH } from '@/lib/portal-auth/session-routes';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { status, message, sessionReady, nextPath } =
    useConfirmEmailVerification(token);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col items-center py-10">
        <Spin size="large" tip="Đang xác nhận email..." />
      </div>
    );
  }

  if (status === 'ok') {
    return (
      <Result
        status="success"
        title="Xác nhận email thành công"
        subTitle={message}
        extra={[
          <Link key="tests" href={nextPath}>
            <Button type="primary" size="large">
              {sessionReady && nextPath.startsWith('/lead/complete-profile')
                ? 'Hoàn thiện tài khoản'
                : sessionReady
                  ? 'Tiếp tục đến cổng Ebest'
                  : 'Tiếp tục'}
            </Button>
          </Link>,
          !sessionReady ? (
            <Link key="login" href={PORTAL_LOGIN_PATH}>
              <Button size="large">Đăng nhập</Button>
            </Link>
          ) : null,
          <Link key="new" href={PORTAL_MOCK_TEST_ROUTES.onlineRegisterGuest}>
            <Button size="large">Đăng ký thi mới</Button>
          </Link>,
        ].filter(Boolean)}
      />
    );
  }

  return <Alert type="error" message={message} showIcon />;
}

export function MockTestOnlineVerifyEmail() {
  return (
    <MockTestOnlineFunnelShell step="register">
      <Suspense
        fallback={
          <div className="flex justify-center py-10">
            <Spin size="large" tip="Đang tải..." />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </MockTestOnlineFunnelShell>
  );
}

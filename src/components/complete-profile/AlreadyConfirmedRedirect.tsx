'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Card, ConfigProvider, Typography } from 'antd';
import { BrandedPublicShell } from '@/components/branding/BrandedPublicShell';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';
import { APP_BRAND } from '@/lib/ui-constants';

const REDIRECT_SECONDS = 5;

export function AlreadyConfirmedRedirect() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      router.replace('/login');
    }, REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [router]);

  return (
    <ConfigProvider theme={ebestPublicAntdTheme}>
      <BrandedPublicShell
        maxWidthClass="max-w-md"
        logoPriority
        tagline={`Liên kết hoàn thiện hồ sơ — ${APP_BRAND}`}
      >
        <Card
          bordered={false}
          className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10"
        >
          <Alert
            type="success"
            showIcon
            message="Tài khoản cổng học viên đã được tạo"
            description={
              <Typography.Paragraph style={{ margin: 0 }}>
                Bạn đã có tài khoản đăng nhập. Sẽ chuyển về trang đăng nhập sau{' '}
                <strong>{countdown}s</strong>.
              </Typography.Paragraph>
            }
          />
        </Card>
      </BrandedPublicShell>
    </ConfigProvider>
  );
}

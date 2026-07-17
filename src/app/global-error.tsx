'use client';

import { useEffect } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { CannotConnectToServerPanel } from '@/components/errors/CannotConnectToServerPanel';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';
import {
  isUpstreamConnectionFailure,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import './globals.css';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Bắt lỗi từ RootLayout (vd. CRM chết khi resolve session) —
 * phải tự render `<html>` / `<body>`.
 */
export default function GlobalError({ error, reset }: Props) {
  const isConnection = isUpstreamConnectionFailure(error);

  useEffect(() => {
    console.error('[student-portal] global-error', error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen m-0 p-0 bg-gray-50 antialiased">
        <AntdRegistry>
          <ConfigProvider theme={ebestPublicAntdTheme}>
            {isConnection ? (
              <CannotConnectToServerPanel onRetry={reset} />
            ) : (
              <CannotConnectToServerPanel
                onRetry={reset}
                title="Đã xảy ra sự cố"
                description={STUDENT_SAFE_USER_MESSAGES.generic}
              />
            )}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

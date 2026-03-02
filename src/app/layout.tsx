import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { AuthProvider } from '@/contexts/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ebest English - Student Portal',
  description: 'Hoàn thiện thông tin và cổng học viên Ebest English',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 antialiased">
        <AntdRegistry>
          <App>
            <AuthProvider>{children}</AuthProvider>
          </App>
        </AntdRegistry>
      </body>
    </html>
  );
}

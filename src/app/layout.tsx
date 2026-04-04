import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { AuthProvider } from '@/contexts/auth-context';
import { defaultMetadata } from '@/lib/metadata';
import './globals.css';

export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen m-0 p-0 bg-gray-50 antialiased">
        <AntdRegistry>
          <App>
            <AuthProvider>{children}</AuthProvider>
          </App>
        </AntdRegistry>
      </body>
    </html>
  );
}

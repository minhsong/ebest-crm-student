import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { AuthProvider } from '@/contexts/auth-context';
import { defaultMetadata } from '@/lib/metadata';
import { parseStudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import { fetchStudentMeForSsr } from '@/lib/server/student-me';
import './globals.css';

export const metadata = defaultMetadata;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchStudentMeForSsr();
  const initialCustomer = parseStudentMeCustomerBrief(me?.customer ?? null);

  return (
    <html lang="vi">
      <body className="min-h-screen m-0 p-0 bg-gray-50 antialiased">
        <AntdRegistry>
          <App>
            <AuthProvider initialCustomer={initialCustomer}>{children}</AuthProvider>
          </App>
        </AntdRegistry>
      </body>
    </html>
  );
}

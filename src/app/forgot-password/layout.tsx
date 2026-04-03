import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Quên mật khẩu',
  description:
    'Yêu cầu đặt lại mật khẩu cổng học viên – nhận link qua email đã đăng ký.',
  path: '/forgot-password',
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Đổi mật khẩu',
  description:
    'Đổi mật khẩu đăng nhập – Cổng học viên Ebest English.',
  path: '/change-password',
});

export default function ChangePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

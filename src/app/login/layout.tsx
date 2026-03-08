import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Đăng nhập',
  description:
    'Đăng nhập cổng học viên Ebest English – Sử dụng email hoặc số điện thoại và mật khẩu.',
  path: '/login',
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

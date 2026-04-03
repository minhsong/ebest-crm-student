import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Đặt lại mật khẩu',
  description:
    'Đặt mật khẩu mới cho cổng học viên từ liên kết trong email.',
  path: '/reset-password',
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

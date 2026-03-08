import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Hồ sơ cá nhân',
  description:
    'Xem và cập nhật thông tin cá nhân – Cổng học viên Ebest English.',
  path: '/profile',
});

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

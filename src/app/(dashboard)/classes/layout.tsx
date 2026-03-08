import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Lớp học của tôi',
  description:
    'Xem lịch học và thông tin lớp – Cổng học viên Ebest English.',
  path: '/classes',
});

export default function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

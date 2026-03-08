import { buildPageMetadata } from '@/lib/metadata';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata = buildPageMetadata({
  title: 'Tổng quan',
  description:
    'Cổng học viên Ebest English – Xem lịch học, điểm danh, bài tập và hóa đơn. The best home for English lovers.',
  path: '/',
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}

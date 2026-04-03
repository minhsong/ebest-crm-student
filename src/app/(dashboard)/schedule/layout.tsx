import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Lịch học',
  description:
    'Lịch buổi học đã lên kế hoạch — ngày giờ, phòng, giáo viên và bài học.',
  path: '/schedule',
});

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

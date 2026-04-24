import { buildPageMetadata } from '@/lib/metadata';
import DashboardLayoutClient from './DashboardLayoutClient';
import { fetchStudentMeForSsr } from '@/lib/server/student-me';

export const metadata = buildPageMetadata({
  title: 'Tổng quan',
  description:
    'Cổng học viên Ebest English – Xem lịch học, điểm danh, bài tập và hóa đơn. The best home for English lovers.',
  path: '/',
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialClasses: Array<{ id: number; name: string; status?: string | null }> = [];

  const me = await fetchStudentMeForSsr();
  if (Array.isArray(me?.classes)) {
    initialClasses = me!.classes!
      .map((c) => {
        const o = c as { id?: unknown; name?: unknown; status?: unknown };
        const id = Number(o?.id);
        const name = typeof o?.name === 'string' ? o.name : '';
        const status =
          typeof o?.status === 'string' || o?.status === null
            ? (o.status as string | null)
            : null;
        if (!Number.isFinite(id) || !name) return null;
        return { id, name, status };
      })
      .filter(Boolean) as Array<{ id: number; name: string; status?: string | null }>;
  }

  return <DashboardLayoutClient initialClasses={initialClasses}>{children}</DashboardLayoutClient>;
}

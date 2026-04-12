import { QA_LIST_PAGE_DESCRIPTION } from '@/features/qa/lib/seo';
import { buildDashboardPageMetadata } from '@/lib/metadata';

export const metadata = buildDashboardPageMetadata({
  title: 'Hỏi đáp',
  description: QA_LIST_PAGE_DESCRIPTION,
  path: '/qa',
});

export default function QaSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

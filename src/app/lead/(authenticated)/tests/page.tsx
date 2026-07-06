import { LeadMockTestResultsView } from '@/features/mock-test-portal/components/LeadMockTestResultsView';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Lịch sử thi thử',
  description:
    'Theo dõi buổi thi tại trung tâm và kết quả thi thử online trên cổng Ebest English.',
  path: '/lead/tests',
});

export default async function LeadTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const sp = await searchParams;
  return <LeadMockTestResultsView notice={sp.notice?.trim() || null} />;
}

import { LeadCoursesPageClient } from '@/components/lead-portal/LeadCoursesPageClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Các khóa học',
  description: 'Khám phá chương trình học tại Ebest English.',
  path: '/lead/courses',
});

export default function LeadCoursesPage() {
  return <LeadCoursesPageClient />;
}

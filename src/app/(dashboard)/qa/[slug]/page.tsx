import { QaDetailPageClient } from '@/features/qa';
import { buildQaDetailDescription } from '@/features/qa/lib/seo';
import { humanizeQaSlug } from '@/features/qa/lib/slug';
import { buildDashboardPageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

/**
 * SEO: `generateMetadata` chạy trên server (title/description/canonical/robots).
 * Tiêu đề tab được tinh chỉnh trên client khi đã tải bài (`QaDetailPageClient`).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const title = humanizeQaSlug(slug);
  return buildDashboardPageMetadata({
    title,
    description: buildQaDetailDescription(slug),
    path: `/qa/${encodeURIComponent(slug)}`,
  });
}

export default function QaDetailPage({ params }: Props) {
  return <QaDetailPageClient slug={params.slug} />;
}

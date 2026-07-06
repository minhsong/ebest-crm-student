import { redirect } from 'next/navigation';
import { fetchPortalExploreFromCrm } from '@/lib/portal-course-catalog/fetch-portal-explore';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Về Ebest English',
  description: 'Tìm hiểu về trung tâm Anh ngữ Ebest English.',
  path: '/lead/about',
});

const FALLBACK_ABOUT_URL = 'https://ebest.edu.vn/ve-chung-toi/';

export default async function LeadAboutPage() {
  try {
    const explore = await fetchPortalExploreFromCrm('vi-VN');
    redirect(explore.siteLinks.aboutUrl || FALLBACK_ABOUT_URL);
  } catch {
    redirect(FALLBACK_ABOUT_URL);
  }
}

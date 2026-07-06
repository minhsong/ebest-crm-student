import type { PortalExplorePayload } from '@/lib/portal-course-catalog/types';
import type { PortalMarketingPayload } from './types';

/**
 * Map Postgres explore → shape Mongo marketing legacy (compat hook / BFF cũ).
 * @deprecated Chỉ dùng cho `/api/portal/marketing` — UI mới dùng explore trực tiếp.
 */
export function mapPortalExploreToLegacyMarketing(
  explore: PortalExplorePayload,
): PortalMarketingPayload {
  return {
    locale: explore.locale,
    consult: {
      zaloUrl: explore.siteLinks.zaloChatUrl,
      facebookUrl: explore.siteLinks.facebookMessengerUrl,
    },
    about: {
      title: 'Về Ebest English',
      blocks: [
        {
          heading: 'Giới thiệu',
          bodyHtml:
            '<p>Xem thêm thông tin tại trang chính thức của Ebest.</p>',
        },
      ],
    },
    courses: explore.courses.map((course) => ({
      id: course.code,
      title: course.title,
      summary: course.shortDescription,
      imageUrl: course.thumbnailUrl ?? undefined,
      ctaUrl: course.detailUrl,
      sortOrder: course.sortOrder,
    })),
    updatedAt: new Date().toISOString(),
  };
}

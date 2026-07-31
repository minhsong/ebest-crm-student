'use client';

import { PortalCourseRecommendationsSection } from '@/components/lead-portal/PortalCourseRecommendationsSection';
import { usePortalCourseRecommendations } from '@/hooks/use-portal-course-recommendations';

type Props = {
  enabled?: boolean;
  preferExplore?: boolean;
  sectionId?: string;
  title?: string;
  compact?: boolean;
  className?: string;
};

/** Container — fetch/reuse CRE cho Lead/Customer đã đăng nhập. */
export function PortalCourseRecommendationsBlock({
  enabled = true,
  preferExplore = true,
  sectionId,
  title,
  compact,
  className,
}: Props) {
  const { data, loading, error } = usePortalCourseRecommendations({
    enabled,
    preferExplore,
  });

  return (
    <PortalCourseRecommendationsSection
      data={data}
      loading={loading}
      error={error}
      sectionId={sectionId}
      title={title}
      compact={compact}
      className={className}
    />
  );
}

'use client';

import { PortalCourseRecommendationsSection } from '@/components/lead-portal/PortalCourseRecommendationsSection';
import { usePortalCourseRecommendations } from '@/hooks/use-portal-course-recommendations';
import { usePortalSession } from '@/hooks/usePortalSession';
import {
  getCustomerClassesFromPortalSession,
  getPortalActor,
} from '@/lib/portal-auth/portal-session-selectors';

type Props = {
  enabled?: boolean;
  preferExplore?: boolean;
  sectionId?: string;
  title?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Container — fetch/reuse CRE cho Lead/Customer đã đăng nhập.
 * Ẩn khi customer đã có lớp tại Ebest (CRE đã xong nhiệm vụ; Care tiếp tục).
 */
export function PortalCourseRecommendationsBlock({
  enabled = true,
  preferExplore = true,
  sectionId,
  title,
  compact,
  className,
}: Props) {
  const portal = usePortalSession();
  const actor = getPortalActor(portal);
  const customerClasses = getCustomerClassesFromPortalSession(portal);
  const hideForEnrolledCustomer =
    actor === 'customer' && customerClasses.length > 0;
  const fetchEnabled = enabled && !hideForEnrolledCustomer;

  const { data, loading, error } = usePortalCourseRecommendations({
    enabled: fetchEnabled,
    preferExplore,
  });

  if (hideForEnrolledCustomer) {
    return null;
  }

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

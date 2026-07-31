/**
 * Course Recommendations (CRE) — Portal HV
 *
 * Pattern đóng gói:
 * - `useCourseRecommendations` / `usePortalCourseRecommendations` — logic fetch
 * - `CourseRecommendationsSection` — UI thuần
 * - `CourseRecommendationsBlock` — **điểm nhúng chuẩn** (hook + section)
 *
 * @example
 * ```tsx
 * import { CourseRecommendationsBlock } from '@/features/course-recommendations';
 * <CourseRecommendationsBlock preferExplore compact />
 * ```
 */

export { usePortalCourseRecommendations as useCourseRecommendations } from '@/hooks/use-portal-course-recommendations';
export { usePortalCourseRecommendations } from '@/hooks/use-portal-course-recommendations';

export {
  PortalCourseRecommendationsSection as CourseRecommendationsSection,
  type PortalCourseRecommendationsSectionProps as CourseRecommendationsSectionProps,
} from '@/components/lead-portal/PortalCourseRecommendationsSection';
export { PortalCourseRecommendationsSection } from '@/components/lead-portal/PortalCourseRecommendationsSection';

export { PortalCourseRecommendationsBlock as CourseRecommendationsBlock } from '@/components/lead-portal/PortalCourseRecommendationsBlock';
export { PortalCourseRecommendationsBlock } from '@/components/lead-portal/PortalCourseRecommendationsBlock';

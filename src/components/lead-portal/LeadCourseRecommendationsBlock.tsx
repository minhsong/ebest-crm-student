'use client';

import { CourseRecommendationsBlock } from '@/features/course-recommendations';

/**
 * Trang /lead/courses — CRE qua explore (đã hydrate layout).
 */
export function LeadCourseRecommendationsBlock() {
  return (
    <CourseRecommendationsBlock
      preferExplore
      title="Gợi ý cho bạn"
      sectionId="recommendations"
    />
  );
}

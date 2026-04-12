/** Feature: Hỏi đáp / Knowledge base (Student Portal). */

export { QaListPageClient } from './components/QaListPageClient';
export { QaDetailPageClient } from './components/QaDetailPageClient';
export { QaArticleHtml } from './components/QaArticleHtml';

export { useStudentQaList, useStudentQaBySlug } from './hooks/use-student-qa';

export type {
  StudentPortalQaDetail,
  StudentPortalQaListItem,
  StudentPortalQaListResponse,
} from './lib/types';

export { humanizeQaSlug } from './lib/slug';
export { QA_LIST_PAGE_DESCRIPTION, buildQaDetailDescription } from './lib/seo';

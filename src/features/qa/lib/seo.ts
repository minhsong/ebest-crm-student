import { humanizeQaSlug } from './slug';

export const QA_LIST_PAGE_DESCRIPTION =
  'Câu hỏi thường gặp và tài liệu hướng dẫn – Cổng học viên Ebest English.';

export function buildQaDetailDescription(slug: string): string {
  const label = humanizeQaSlug(slug);
  return `Tài liệu và trả lời: ${label}. ${QA_LIST_PAGE_DESCRIPTION}`;
}

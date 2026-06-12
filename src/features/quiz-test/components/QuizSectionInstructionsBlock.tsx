'use client';

import type { QuizFormSectionPayload } from '@/features/quiz-test/types';
import { Alert } from 'antd';

export type QuizSectionInstructionsBlockProps = {
  section?: Pick<QuizFormSectionPayload, 'instructions' | 'title'> | null | undefined;
  /** Ví dụ «Phần 7/8: Listening — True/False». */
  sectionHeading?: string | null;
  /** Ẩn dòng heading phần (vd. đã có trên Collapse). */
  hideSectionHeading?: boolean;
};

/**
 * Hướng dẫn section — Alert nổi bật, chữ tương phản cao (không xám mờ).
 */
export function QuizSectionInstructionsBlock({
  section,
  sectionHeading,
  hideSectionHeading = false,
}: QuizSectionInstructionsBlockProps) {
  const html = section?.instructions?.trim();
  if (!html) return null;

  const heading =
    !hideSectionHeading &&
    (sectionHeading?.trim() || section?.title?.trim() || '');

  return (
    <Alert
      type="info"
      showIcon
      className="quiz-section-instructions-alert !items-start !border-[#91caff] !bg-[#e6f4ff] !py-3 dark:!border-blue-800 dark:!bg-blue-950/40"
      message={
        <span className="text-sm font-semibold tracking-wide text-[#003eb3] dark:text-blue-200">
          Hướng dẫn phần
        </span>
      }
      description={
        <div className="mt-1 space-y-2">
          {heading ? (
            <p className="m-0 text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
              {heading}
            </p>
          ) : null}
          <div
            className="quiz-section-instructions-body text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100 [&_a]:font-medium [&_a]:text-[#0958d9] [&_a]:underline [&_em]:text-neutral-900 [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_strong]:font-semibold [&_strong]:text-neutral-900 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 dark:[&_a]:text-blue-300 dark:[&_em]:text-neutral-100 dark:[&_strong]:text-neutral-100"
            // eslint-disable-next-line react/no-danger -- CRM-authored HTML
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      }
    />
  );
}

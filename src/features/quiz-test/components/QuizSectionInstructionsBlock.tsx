'use client';

import type { QuizFormSectionPayload } from '@/features/quiz-test/types';

export function QuizSectionInstructionsBlock({
  section,
}: {
  section: Pick<QuizFormSectionPayload, 'instructions'> | null | undefined;
}) {
  const html = section?.instructions?.trim();
  if (!html) return null;

  return (
    <div className="rounded-md border border-[var(--ant-color-border)] bg-[var(--ant-color-fill-alter)] px-3 py-2">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--ant-color-text-secondary)]">
        Hướng dẫn phần
      </div>
      <div
        className="text-sm leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-1"
        // eslint-disable-next-line react/no-danger -- CRM-authored HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

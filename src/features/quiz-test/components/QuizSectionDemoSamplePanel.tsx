'use client';

import type { QuizFormSectionDemoSample } from '@/features/quiz-test/types';
import { Tag } from 'antd';
import { quizAnchorDomId } from '@/features/quiz-test/lib/quiz-section-navigation';
import { SECTION_INTRO_DEMO_HIGHLIGHT_KEY } from '@/features/quiz-test/lib/quiz-section-listening-queue';

export type QuizSectionDemoSamplePanelProps = {
  demoSample: QuizFormSectionDemoSample;
};

/**
 * Ví dụ minh họa trong khối hướng dẫn — hiện đáp án mẫu, không phải câu hỏi thi.
 */
export function QuizSectionDemoSamplePanel({
  demoSample,
}: QuizSectionDemoSamplePanelProps) {
  const correct = new Set(
    (demoSample.revealedAnswer?.correctOptionIds ?? []).map(String),
  );
  const options = Array.isArray(demoSample.options) ? demoSample.options : [];
  const stem = typeof demoSample.stem === 'string' ? demoSample.stem.trim() : '';

  return (
    <div
      id={quizAnchorDomId(SECTION_INTRO_DEMO_HIGHLIGHT_KEY)}
      className="mt-3 rounded-md border border-[#91caff] bg-white/70 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/30"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-[#003eb3] dark:text-blue-200">
          Ví dụ minh họa
        </span>
        <Tag color="processing">Không tính điểm</Tag>
      </div>
      {stem ? (
        <div
          className="mb-2 text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100 [&_p]:my-1"
          // eslint-disable-next-line react/no-danger -- CRM-authored HTML
          dangerouslySetInnerHTML={{ __html: stem }}
        />
      ) : null}
      <ul className="m-0 list-none space-y-1.5 p-0">
        {options.map((opt) => {
          const id = String(opt.id ?? '');
          const isCorrect = correct.has(id);
          return (
            <li
              key={id || opt.label}
              className={
                isCorrect
                  ? 'rounded border border-emerald-400 bg-emerald-50 px-2 py-1.5 text-sm font-medium text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200'
              }
            >
              <span className="mr-2 font-semibold">{id.replace(/^opt_/i, '').toUpperCase()}</span>
              {opt.label}
              {isCorrect ? (
                <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  (đáp án mẫu)
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

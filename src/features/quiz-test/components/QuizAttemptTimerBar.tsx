'use client';

import { formatCountdownHhMmSs } from '@/features/quiz-test/lib/quiz-runtime-view';
import { HEADER_HEIGHT } from '@/lib/ui-constants';
import { Tag } from 'antd';

export type QuizAttemptTimerBarProps = {
  remainingSeconds: number;
};

/** Thanh đếm ngược — chỉ render UI theo props. */
export function QuizAttemptTimerBar({ remainingSeconds }: QuizAttemptTimerBarProps) {
  return (
    <div
      className="sticky z-[100] flex justify-center border-b border-neutral-200 bg-white/90 py-2 backdrop-blur-sm md:justify-end md:px-6 dark:border-neutral-700 dark:bg-neutral-950/90"
      style={{ top: HEADER_HEIGHT }}
    >
      <Tag className="!m-0 inline-flex items-center justify-center border-2 !border-red-600 !bg-red-50 px-5 py-2 font-mono text-3xl font-bold tabular-nums !text-red-600 md:text-4xl dark:!border-red-500 dark:!bg-red-950/50 dark:!text-red-400">
        {formatCountdownHhMmSs(remainingSeconds)}
      </Tag>
    </div>
  );
}

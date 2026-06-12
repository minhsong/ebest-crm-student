'use client';

import { useQuizAttemptStickyPin } from '@/features/quiz-test/hooks/useQuizAttemptStickyPin';
import { QuizAttemptStatusCluster } from '@/features/quiz-test/components/QuizAttemptStatusCluster';
import type { QuizAttemptStatusClusterProps } from '@/features/quiz-test/components/QuizAttemptStatusCluster';
import { isQuizAttemptStatusClusterVisible } from '@/features/quiz-test/lib/quiz-attempt-status-ui';

export type QuizAttemptStickyStatusBarProps = QuizAttemptStatusClusterProps;

/**
 * Timer + lượt nghe — trong Card căn phải; scroll xuống pin góc phải trên (~50px dưới header).
 */
export function QuizAttemptStickyStatusBar(props: QuizAttemptStickyStatusBarProps) {
  const visible = isQuizAttemptStatusClusterVisible(props);

  const {
    containerRef,
    sentinelRef,
    barRef,
    isPinned,
    barHeight,
    pinRight,
    pinMaxWidth,
    stickyTop,
  } = useQuizAttemptStickyPin(visible);

  if (!visible) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />
      {isPinned && barHeight > 0 ? (
        <div style={{ height: barHeight }} aria-hidden />
      ) : null}
      <div
        ref={barRef}
        className={
          isPinned
            ? 'inline-flex max-w-full flex-wrap items-center justify-end gap-2 rounded-lg border border-neutral-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-sm dark:border-neutral-600 dark:bg-neutral-950/95 sm:gap-3 sm:px-3 sm:py-2'
            : 'flex w-full flex-wrap items-center justify-end gap-2 border-b border-neutral-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95 sm:gap-3 md:px-6'
        }
        style={
          isPinned
            ? {
                position: 'fixed',
                top: stickyTop,
                right: pinRight,
                left: 'auto',
                width: 'max-content',
                maxWidth: pinMaxWidth,
                zIndex: 110,
                boxSizing: 'border-box',
              }
            : undefined
        }
      >
        <QuizAttemptStatusCluster {...props} />
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { useQuizAttemptStickyPin } from '@/features/quiz-test/hooks/useQuizAttemptStickyPin';
import { QuizAttemptStatusCluster } from '@/features/quiz-test/components/QuizAttemptStatusCluster';
import type { QuizAttemptStatusClusterProps } from '@/features/quiz-test/components/QuizAttemptStatusCluster';
import { isQuizAttemptStatusClusterVisible } from '@/features/quiz-test/lib/quiz-attempt-status-ui';
import '@/features/quiz-test/components/quiz-attempt-sticky-status-bar.css';

export type QuizAttemptStickyStatusBarProps = QuizAttemptStatusClusterProps & {
  /** Cột trái: quay lại, title, meta đề — luôn hiển thị. */
  headerLeft?: ReactNode;
};

/**
 * Header làm bài gộp: trái thông tin đề, phải cụm timer / số câu / lượt nghe (vừa đủ);
 * scroll → chỉ cụm phải pin góc trên cột content.
 */
export function QuizAttemptStickyStatusBar({
  headerLeft,
  ...statusProps
}: QuizAttemptStickyStatusBarProps) {
  const statusVisible = isQuizAttemptStatusClusterVisible(statusProps);

  const {
    containerRef,
    sentinelRef,
    barRef,
    isPinned,
    barHeight,
    pinLeft,
    pinWidth,
    stickyTop,
  } = useQuizAttemptStickyPin(statusVisible);

  const cardClassName = `quiz-attempt-sticky-card ${
    isPinned ? 'quiz-attempt-sticky-card--pinned' : 'quiz-attempt-sticky-card--in-flow'
  }`;

  const statusCard = statusVisible ? (
    <div ref={barRef} className={cardClassName}>
      <QuizAttemptStatusCluster {...statusProps} />
    </div>
  ) : null;

  const asideInFlow =
    statusVisible && !isPinned ? (
      <div className="quiz-attempt-sticky-slot">{statusCard}</div>
    ) : statusVisible && isPinned ? (
      <div
        className="quiz-attempt-sticky-placeholder"
        style={{ height: barHeight > 0 ? barHeight : undefined }}
        aria-hidden
      />
    ) : null;

  return (
    <div ref={containerRef} className="quiz-attempt-taking-header">
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

      <div className="quiz-attempt-taking-header-row">
        {headerLeft ? (
          <div className="quiz-attempt-taking-header-main">{headerLeft}</div>
        ) : null}
        {statusVisible ? (
          <div className="quiz-attempt-taking-header-aside">{asideInFlow}</div>
        ) : null}
      </div>

      {statusVisible && isPinned ? (
        <div
          className="quiz-attempt-sticky-pin-layer"
          style={{
            top: stickyTop,
            left: pinLeft,
            width: pinWidth,
          }}
        >
          {statusCard}
        </div>
      ) : null}
    </div>
  );
}

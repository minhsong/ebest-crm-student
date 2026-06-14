'use client';

import type { ReactNode } from 'react';
import { QuizAttemptOutlineToggleButton } from '@/features/quiz-test/components/QuizAttemptOutlineToggleButton';
import { useQuizAttemptStickyPin } from '@/features/quiz-test/hooks/useQuizAttemptStickyPin';
import { QuizAttemptStatusCluster } from '@/features/quiz-test/components/QuizAttemptStatusCluster';
import type { QuizAttemptStatusClusterProps } from '@/features/quiz-test/components/QuizAttemptStatusCluster';
import { isQuizAttemptStatusClusterVisible } from '@/features/quiz-test/lib/quiz-attempt-status-ui';
import '@/features/quiz-test/components/quiz-attempt-sticky-status-bar.css';

export type QuizAttemptStickyStatusBarProps = QuizAttemptStatusClusterProps & {
  headerLeft?: ReactNode;
  showOutline?: boolean;
  outlineOpen?: boolean;
  onToggleOutline?: () => void;
};

type QuizAttemptHeaderAsideProps = {
  statusVisible: boolean;
  isPinned: boolean;
  barHeight: number;
  statusCard: ReactNode;
  outlineToggle: ReactNode | null;
};

function QuizAttemptHeaderAside({
  statusVisible,
  isPinned,
  barHeight,
  statusCard,
  outlineToggle,
}: QuizAttemptHeaderAsideProps) {
  if (statusVisible && !isPinned) {
    return (
      <div className="quiz-attempt-header-aside-stack">
        <div className="quiz-attempt-sticky-slot">{statusCard}</div>
        {outlineToggle ? (
          <div className="quiz-attempt-outline-below">{outlineToggle}</div>
        ) : null}
      </div>
    );
  }

  if (statusVisible && isPinned) {
    return (
      <div
        className="quiz-attempt-sticky-placeholder"
        style={{ height: barHeight > 0 ? barHeight : undefined }}
        aria-hidden
      />
    );
  }

  if (outlineToggle) {
    return (
      <div className="quiz-attempt-header-aside-stack">
        <div className="quiz-attempt-outline-below">{outlineToggle}</div>
      </div>
    );
  }

  return null;
}

/**
 * Header làm bài: trái thông tin đề; phải card metric + mục lục (dưới card).
 * Scroll → card pin góc phải, nút mục lục cạnh Số câu.
 */
export function QuizAttemptStickyStatusBar({
  headerLeft,
  showOutline = false,
  outlineOpen = false,
  onToggleOutline,
  ...statusProps
}: QuizAttemptStickyStatusBarProps) {
  const statusVisible = isQuizAttemptStatusClusterVisible(statusProps);
  const pinEnabled = statusVisible;

  const {
    containerRef,
    sentinelRef,
    barRef,
    isPinned,
    barHeight,
    pinLeft,
    pinWidth,
    stickyTop,
  } = useQuizAttemptStickyPin(pinEnabled);

  const outlineToggle =
    showOutline && onToggleOutline ? (
      <QuizAttemptOutlineToggleButton
        outlineOpen={outlineOpen}
        onToggleOutline={onToggleOutline}
        variant={isPinned ? 'inline' : 'below'}
      />
    ) : null;

  const cardClassName = `quiz-attempt-sticky-card ${
    isPinned ? 'quiz-attempt-sticky-card--pinned' : 'quiz-attempt-sticky-card--in-flow'
  }`;

  const statusCard = statusVisible ? (
    <div ref={barRef} className={cardClassName}>
      <QuizAttemptStatusCluster
        {...statusProps}
        outlineAfterProgress={isPinned ? outlineToggle : undefined}
      />
    </div>
  ) : null;

  const showAside = statusVisible || Boolean(outlineToggle);

  return (
    <div ref={containerRef} className="quiz-attempt-taking-header">
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

      <div className="quiz-attempt-taking-header-row">
        {headerLeft ? (
          <div className="quiz-attempt-taking-header-main">{headerLeft}</div>
        ) : null}
        {showAside ? (
          <div className="quiz-attempt-taking-header-aside">
            <QuizAttemptHeaderAside
              statusVisible={statusVisible}
              isPinned={isPinned}
              barHeight={barHeight}
              statusCard={statusCard}
              outlineToggle={outlineToggle}
            />
          </div>
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

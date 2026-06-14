'use client';

import type { ReactNode } from 'react';
import { SoundOutlined } from '@ant-design/icons';
import { formatCountdownHhMmSs } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizAttemptAnswerProgress } from '@/features/quiz-test/lib/quiz-attempt-progress.util';
import {
  isFiniteDisplayNumber,
  isListeningAutoStartCountdownActive,
  shouldShowQuestionProgress,
} from '@/features/quiz-test/lib/quiz-attempt-status-ui';
import { Button, Tag } from 'antd';

export type QuizAttemptStatusClusterProps = {
  showTimer?: boolean;
  remainingSeconds?: number;
  questionProgress?: QuizAttemptAnswerProgress | null;
  listeningRemainingPlays?: number | null;
  listeningAutoStartCountdown?: number | null;
  listeningPlaybackBusy?: boolean;
  showManualListenButton?: boolean;
  onManualListenStart?: () => void;
};

type StatusMetricCellProps = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  trailing?: ReactNode;
  /** Viền trái phân tách metric (trừ ô đầu). */
  showDivider?: boolean;
};

function StatusMetricCell({
  label,
  value,
  valueClassName = '',
  trailing,
  showDivider = false,
}: StatusMetricCellProps) {
  return (
    <div
      className={`flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center px-2 py-0.5 text-center sm:min-w-[4.75rem] sm:px-2.5 ${
        showDivider ? 'border-l border-neutral-200 dark:border-neutral-600' : ''
      }`}
    >
      <span className="text-[10px] leading-tight text-neutral-500 dark:text-neutral-400 sm:text-[11px]">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums leading-tight text-neutral-900 dark:text-neutral-50 sm:text-base ${valueClassName}`}
      >
        {value}
      </span>
      {trailing ? <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1">{trailing}</div> : null}
    </div>
  );
}

/** Cụm timer + tiến độ câu + lượt nghe — dùng trong sticky bar. */
export function QuizAttemptStatusCluster({
  showTimer = false,
  remainingSeconds = 0,
  questionProgress = null,
  listeningRemainingPlays = null,
  listeningAutoStartCountdown = null,
  listeningPlaybackBusy = false,
  showManualListenButton = false,
  onManualListenStart,
}: QuizAttemptStatusClusterProps) {
  const remainingPlays = isFiniteDisplayNumber(listeningRemainingPlays)
    ? listeningRemainingPlays
    : null;
  const showListening = remainingPlays != null;
  const isAutoStartCountdown = isListeningAutoStartCountdownActive(
    listeningAutoStartCountdown,
  );
  const showProgress = shouldShowQuestionProgress(questionProgress);

  const metrics: ReactNode[] = [];

  if (showTimer) {
    metrics.push(
      <StatusMetricCell
        key="timer"
        label="Thời gian"
        value={formatCountdownHhMmSs(remainingSeconds)}
        valueClassName="font-mono text-red-600 dark:text-red-400"
        showDivider={metrics.length > 0}
      />,
    );
  }

  if (showProgress && questionProgress) {
    metrics.push(
      <StatusMetricCell
        key="progress"
        label="Số câu"
        value={`${questionProgress.answeredCount}/${questionProgress.totalCount}`}
        showDivider={metrics.length > 0}
      />,
    );
  }

  if (showListening && !isAutoStartCountdown) {
    metrics.push(
      <StatusMetricCell
        key="listening"
        label="Lượt nghe"
        value={Math.max(0, remainingPlays!)}
        showDivider={metrics.length > 0}
        trailing={
          <>
            {listeningPlaybackBusy ? (
              <Tag color="processing" className="!m-0 !text-[10px] !leading-4">
                Đang phát
              </Tag>
            ) : null}
            {showManualListenButton ? (
              <Button
                type="primary"
                size="small"
                className="!h-6 !px-2 !text-[11px]"
                icon={<SoundOutlined />}
                onClick={onManualListenStart}
              >
                Nghe
              </Button>
            ) : null}
          </>
        }
      />,
    );
  }

  if (!metrics.length && !isAutoStartCountdown) {
    return null;
  }

  return (
    <div className="flex w-max max-w-full flex-col gap-1">
      {metrics.length ? (
        <div className="flex w-max max-w-full flex-wrap items-stretch">
          {metrics}
        </div>
      ) : null}

      {isAutoStartCountdown ? (
        <div
          className="rounded border border-red-500/80 bg-red-50 px-2 py-1 text-center text-[11px] font-medium leading-snug text-red-600 sm:text-xs dark:border-red-500 dark:bg-red-950/60 dark:text-red-400"
          role="status"
          aria-live="polite"
        >
          Phần nghe sẽ bắt đầu sau{' '}
          <strong className="tabular-nums">{listeningAutoStartCountdown}</strong> giây
        </div>
      ) : null}
    </div>
  );
}

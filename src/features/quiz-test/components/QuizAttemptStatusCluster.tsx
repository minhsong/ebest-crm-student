'use client';

import { SoundOutlined } from '@ant-design/icons';
import { formatCountdownHhMmSs } from '@/features/quiz-test/lib/quiz-runtime-view';
import {
  isFiniteDisplayNumber,
  isListeningAutoStartCountdownActive,
  shouldShowListeningRemainingPlays,
} from '@/features/quiz-test/lib/quiz-attempt-status-ui';
import { Button, Tag } from 'antd';

export type QuizAttemptStatusClusterProps = {
  showTimer?: boolean;
  remainingSeconds?: number;
  listeningRemainingPlays?: number | null;
  listeningAutoStartCountdown?: number | null;
  listeningPlaybackBusy?: boolean;
  showManualListenButton?: boolean;
  onManualListenStart?: () => void;
};

/** Cụm timer + lượt nghe — dùng trong sticky bar. */
export function QuizAttemptStatusCluster({
  showTimer = false,
  remainingSeconds = 0,
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

  return (
    <>
      {isAutoStartCountdown ? (
        <div
          className="rounded-md border-2 border-red-600 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 sm:px-3 sm:text-sm dark:border-red-500 dark:bg-red-950/60 dark:text-red-400"
          role="status"
          aria-live="polite"
        >
          The listening section will start in{' '}
          <strong className="tabular-nums">{listeningAutoStartCountdown}</strong> seconds
        </div>
      ) : null}

      {showListening && !isAutoStartCountdown ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-200">
          <SoundOutlined aria-hidden className="text-blue-600 dark:text-blue-400" />
          <span className="whitespace-nowrap">
            Còn{' '}
            <strong className="tabular-nums text-neutral-900 dark:text-neutral-50">
              {Math.max(0, remainingPlays)}
            </strong>{' '}
            lượt nghe
          </span>
          {listeningPlaybackBusy ? (
            <Tag color="processing" className="!m-0">
              Đang phát
            </Tag>
          ) : null}
          {showManualListenButton ? (
            <Button
              type="primary"
              size="small"
              icon={<SoundOutlined />}
              onClick={onManualListenStart}
            >
              Nghe
            </Button>
          ) : null}
        </div>
      ) : null}

      {showTimer ? (
        <Tag className="!m-0 inline-flex shrink-0 items-center justify-center border-2 !border-red-600 !bg-red-50 px-3 py-1 font-mono text-xl font-bold tabular-nums !text-red-600 sm:px-4 sm:text-2xl dark:!border-red-500 dark:!bg-red-950/50 dark:!text-red-400">
          {formatCountdownHhMmSs(remainingSeconds)}
        </Tag>
      ) : null}
    </>
  );
}

'use client';

import { SoundFilled } from '@ant-design/icons';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { QuizFormItemPayload } from '@/features/quiz-test/types';
import {
  extractQuizAudioTracks,
} from '@/features/quiz-test/lib/quiz-content-audio';
import type { QuizGradingPerItem } from '@/features/quiz-test/lib/quiz-runtime-view';
import { listeningUnitHasAutoplayEligibleAudio } from '@/features/quiz-test/lib/quiz-listening-rules';
import { quizAnchorDomId } from '@/features/quiz-test/lib/quiz-section-navigation';
import { Card, Typography } from 'antd';
import { memo, useCallback, useMemo } from 'react';

import { QuizHiddenListeningPlayer } from './QuizHiddenListeningPlayer';
import { QuizQuestionCard } from './QuizQuestionCard';

export type QuizQuestionBundleCardProps = {
  title?: string;
  stemHtml?: string | null;
  /** Nội dung bundle cha — dùng cho audio listening. */
  bundleContent?: Record<string, unknown> | null;
  items: QuizFormItemPayload[];
  startQuestionIndex: number;
  answerMap: Record<string, unknown>;
  readOnly: boolean;
  onAnswerChange?: (formItemId: string, next: string | string[]) => void;
  correctByFormItemId?: Record<string, boolean>;
  /** Detailed grading per item (includes correctOptionIds, selectedOptionIds) */
  gradingPerItem?: Record<string, QuizGradingPerItem | undefined>;
  listeningUnitKey?: string;
  listeningRemaining?: number;
  reportListeningCycle?: (formItemKey: string) => Promise<boolean>;
  /** Anchor phần nhóm (formItemId hàng bundle) — scroll / URL. */
  bundleAnchorId?: string | null;
  listeningHighlight?: boolean;
  embedListeningPlayer?: boolean;
  /** Cho phép hiển thị giải thích */
  showExplanation?: boolean;
};

/** Component quản lý UI cho bundle; câu con tái sử dụng `QuizQuestionCard`. */
export const QuizQuestionBundleCard = memo(function QuizQuestionBundleCard({
  title = 'Nhóm câu hỏi',
  stemHtml,
  bundleContent,
  items,
  startQuestionIndex,
  answerMap,
  readOnly,
  onAnswerChange,
  correctByFormItemId,
  gradingPerItem,
  listeningUnitKey,
  listeningRemaining,
  reportListeningCycle,
  bundleAnchorId,
  listeningHighlight,
  embedListeningPlayer = true,
  showExplanation = false,
}: QuizQuestionBundleCardProps) {
  const audioTracks = useMemo(() => extractQuizAudioTracks(bundleContent), [bundleContent]);
  const rem =
    typeof listeningRemaining === 'number' && Number.isFinite(listeningRemaining)
      ? listeningRemaining
      : 0;
  const canListen =
    embedListeningPlayer &&
    !readOnly &&
    !!reportListeningCycle &&
    !!listeningUnitKey &&
    listeningUnitHasAutoplayEligibleAudio(bundleContent) &&
    audioTracks.length > 0 &&
    rem > 0;

  const handleListeningRoundDone = useCallback(() => {
    if (listeningUnitKey) void reportListeningCycle?.(listeningUnitKey);
  }, [listeningUnitKey, reportListeningCycle]);

  if (!items.length) return null;

  const inner = (
    <Card
      size="small"
      className={
        listeningHighlight
          ? 'border-orange-400 ring-2 ring-orange-500 ring-offset-2 bg-orange-50/30 transition-shadow duration-300'
          : 'border-neutral-200 bg-neutral-50/40 hover:border-neutral-300'
      }
    >
      <div className="flex items-center gap-2">
        <Typography.Text
          strong
          className={`text-base ${listeningHighlight ? 'text-red-600' : ''}`}
        >
          {title}
        </Typography.Text>
        {listeningHighlight ? (
          <SoundFilled className="text-base text-red-500 animate-pulse" title="Đang phát âm thanh" />
        ) : canListen ? (
          <SoundFilled className="text-base text-neutral-400" title="Có âm thanh" />
        ) : null}
      </div>
      {stemHtml ? (
        <div className="mt-2">
          <QaArticleHtml html={stemHtml} />
        </div>
      ) : null}
      {canListen ? (
        <QuizHiddenListeningPlayer
          tracks={audioTracks}
          canPlay={rem > 0}
          onPlaylistRoundCompleted={handleListeningRoundDone}
        />
      ) : null}
      <div className="mt-3 flex flex-col gap-3">
        {items.map((row, idx) => (
          <QuizQuestionCard
            key={String(row.formItemId)}
            row={row}
            questionIndex={startQuestionIndex + idx}
            answerValue={answerMap[String(row.formItemId)]}
            readOnly={readOnly}
            onAnswerChange={onAnswerChange}
            isCorrect={correctByFormItemId?.[String(row.formItemId)]}
            grading={gradingPerItem?.[String(row.formItemId)]}
            scrollAnchorId={quizAnchorDomId(String(row.formItemId))}
            listeningHighlight={listeningHighlight}
            showExplanation={showExplanation}
          />
        ))}
      </div>
    </Card>
  );

  if (bundleAnchorId) {
    return (
      <div id={bundleAnchorId} className="scroll-mt-28">
        {inner}
      </div>
    );
  }

  return inner;
});


'use client';

import { SoundFilled } from '@ant-design/icons';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { QuizFormItemPayload } from '@/features/quiz-test/types';
import { extractQuizAudioTracks } from '@/features/quiz-test/lib/quiz-content-audio';
import {
  canEmbedBundleListeningPlayer,
  normalizeListeningRemaining,
  quizBundleCardClassName,
  quizBundleQuestionsPaneClassName,
  quizBundleShellClassName,
  quizBundleStemPaneClassName,
  shouldSplitBundleLayout,
} from '@/features/quiz-test/lib/quiz-bundle-layout';
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
  const rem = normalizeListeningRemaining(listeningRemaining);
  const canListen = canEmbedBundleListeningPlayer({
    embedListeningPlayer,
    readOnly,
    hasReportCycle: !!reportListeningCycle,
    hasUnitKey: !!listeningUnitKey,
    contentEligible: listeningUnitHasAutoplayEligibleAudio(bundleContent),
    trackCount: audioTracks.length,
    remaining: rem,
  });
  const split = shouldSplitBundleLayout(stemHtml);

  const handleListeningRoundDone = useCallback(() => {
    if (listeningUnitKey) void reportListeningCycle?.(listeningUnitKey);
  }, [listeningUnitKey, reportListeningCycle]);

  if (!items.length) return null;

  const titleRow = (
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
  );

  const body = (
    <Card size="small" className={quizBundleCardClassName(listeningHighlight)}>
      <div className={quizBundleShellClassName(split)}>
        <div className={quizBundleStemPaneClassName(split)}>
          {titleRow}
          {split ? (
            <div className="mt-2">
              <QaArticleHtml html={stemHtml!} />
            </div>
          ) : null}
          {canListen ? (
            <QuizHiddenListeningPlayer
              tracks={audioTracks}
              canPlay={rem > 0}
              onPlaylistRoundCompleted={handleListeningRoundDone}
            />
          ) : null}
        </div>
        <div className={quizBundleQuestionsPaneClassName(split)}>
          {items.map((row, idx) => {
            const key = String(row.formItemId);
            return (
              <QuizQuestionCard
                key={key}
                row={row}
                questionIndex={startQuestionIndex + idx}
                answerValue={answerMap[key]}
                readOnly={readOnly}
                onAnswerChange={onAnswerChange}
                isCorrect={correctByFormItemId?.[key]}
                grading={gradingPerItem?.[key]}
                scrollAnchorId={quizAnchorDomId(key)}
                listeningHighlight={listeningHighlight}
                showExplanation={showExplanation}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );

  if (bundleAnchorId) {
    return (
      <div id={bundleAnchorId} className="scroll-mt-28">
        {body}
      </div>
    );
  }

  return body;
});

'use client';

import {
  CheckCircleFilled,
  CloseCircleFilled,
  RightCircleOutlined,
  SoundFilled,
} from '@ant-design/icons';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { QuizFormItemPayload } from '@/features/quiz-test/types';
import {
  normalizeFillInBlankValue,
  normalizeMcqMultipleValue,
  normalizeMcqSingleValue,
} from '@/features/quiz-test/question-view';
import { buildQuizQuestionViewModel } from '@/features/quiz-test/lib/quiz-question-model';
import { extractQuizAudioTracks } from '@/features/quiz-test/lib/quiz-content-audio';
import { listeningUnitHasAutoplayEligibleAudio } from '@/features/quiz-test/lib/quiz-listening-rules';
import { Button, Card, Space, Typography } from 'antd';
import { memo, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { QuizHiddenListeningPlayer } from './QuizHiddenListeningPlayer';
import { QuizFillInBlankQuestion } from './QuizFillInBlankQuestion';
import { QuizMcqMultipleQuestion } from './QuizMcqMultipleQuestion';
import { QuizMcqSingleQuestion } from './QuizMcqSingleQuestion';
import { QuizUnsupportedQuestionBody } from './QuizUnsupportedQuestionBody';

export type QuizQuestionCardProps = {
  row: QuizFormItemPayload;
  /** Index 0-based để fallback số thứ tự câu trong heading. */
  questionIndex: number;
  /** Giá trị trả lời từ `answersByFormItemId[String(formItemId)]`. */
  answerValue: unknown;
  /** `true`: chỉ xem (kết quả); `false`: làm bài. */
  readOnly: boolean;
  onAnswerChange?: (formItemId: string, next: string | string[]) => void;
  unsupportedHint?: string;
  /** `true` đúng, `false` sai, `undefined` không hiển thị icon. */
  isCorrect?: boolean;
  /** Audio câu đơn — chỉ khi `readOnly === false` và có `reportListeningCycle`. */
  questionContent?: Record<string, unknown> | null;
  listeningUnitKey?: string;
  listeningRemaining?: number;
  reportListeningCycle?: (formItemKey: string) => Promise<void>;
  /** `id` DOM để scroll từ URL `?question=` — §11.4. */
  scrollAnchorId?: string | null;
  /** Viền nổi khi section player đang phát audio của câu/bundle này. */
  listeningHighlight?: boolean;
  /** `false` khi dùng section orchestrator — không mount player ẩn trên card. */
  embedListeningPlayer?: boolean;
  /** Cho phép hiển thị giải thích (khi form có showExplanationOnReview và user đủ điều kiện) */
  showExplanation?: boolean;
};

const DEFAULT_UNSUPPORTED_EDIT =
  'Đề này có câu chưa hỗ trợ làm trắc nghiệm trên cổng học viên.';
const DEFAULT_UNSUPPORTED_VIEW = 'Dạng câu không có đáp án trắc nghiệm.';

type McqOptionWithExplanation = {
  id: string;
  html: string;
  explanation?: string;
  isCorrect?: boolean;
  isSelected?: boolean;
};

/**
 * Một item đề trong form: heading + stem + body theo loại câu.
 * Thêm loại mới: mở rộng `buildQuizQuestionViewModel` hoặc `QuizQuestionUiKind` + một `switch` branch + component renderer.
 */
export const QuizQuestionCard = memo(function QuizQuestionCard({
  row,
  questionIndex,
  answerValue,
  readOnly,
  onAnswerChange,
  unsupportedHint,
  isCorrect,
  questionContent,
  listeningUnitKey,
  listeningRemaining,
  reportListeningCycle,
  scrollAnchorId,
  listeningHighlight,
  embedListeningPlayer = true,
  showExplanation = false,
}: QuizQuestionCardProps) {
  const [showExplanationDetail, setShowExplanationDetail] = useState(false);
  const model = useMemo(
    () => buildQuizQuestionViewModel(row, questionIndex),
    [row, questionIndex],
  );

  const contentForAudio = questionContent ?? row.questionSnapshot?.content;

  const audioTracks = useMemo(
    () => extractQuizAudioTracks(contentForAudio),
    [contentForAudio],
  );

  const listeningKey = listeningUnitKey ?? String(row.formItemId);
  const rem =
    typeof listeningRemaining === 'number' && Number.isFinite(listeningRemaining)
      ? listeningRemaining
      : 0;
  const canListen =
    embedListeningPlayer &&
    !readOnly &&
    !!reportListeningCycle &&
    listeningUnitHasAutoplayEligibleAudio(contentForAudio) &&
    audioTracks.length > 0 &&
    rem > 0;

  const handleListeningRoundDone = useCallback(() => {
    void reportListeningCycle?.(listeningKey);
  }, [listeningKey, reportListeningCycle]);

  const toggleExplanation = useCallback(() => {
    setShowExplanationDetail((prev) => !prev);
  }, []);

  if (!model) return null;

  const unsupportedCopy =
    unsupportedHint ?? (readOnly ? DEFAULT_UNSUPPORTED_VIEW : DEFAULT_UNSUPPORTED_EDIT);

  // Get selected option IDs for MCQ
  const selectedOptionId = normalizeMcqSingleValue(answerValue);
  const selectedOptionIds = normalizeMcqMultipleValue(answerValue);

  // Build options with explanations for result view
  const optionsWithExplanations: McqOptionWithExplanation[] = model.options.map((opt) => {
    const optionExplanation = model.optionExplanations[opt.id];
    const isSelected =
      model.kind === 'mcq_single'
        ? selectedOptionId === opt.id
        : model.kind === 'mcq_multiple'
          ? selectedOptionIds?.includes(opt.id)
          : false;

    return {
      id: opt.id,
      html: opt.html,
      explanation: optionExplanation,
      isCorrect: false,
      isSelected,
    };
  });

  let body: ReactNode = null;
  switch (model.kind) {
    case 'unsupported':
      body = <QuizUnsupportedQuestionBody message={unsupportedCopy} />;
      break;
    case 'mcq_single': {
      body = (
        <div className="mt-4">
          <QuizMcqSingleQuestion
            options={model.options}
            selectedOptionId={selectedOptionId}
            readOnly={readOnly}
            onChange={
              readOnly
                ? undefined
                : (id) => {
                    onAnswerChange?.(model.formItemId, id);
                  }
            }
          />
        </div>
      );
      break;
    }
    case 'mcq_multiple': {
      body = (
        <div className="mt-4">
          <QuizMcqMultipleQuestion
            options={model.options}
            selectedOptionIds={selectedOptionIds}
            readOnly={readOnly}
            onChange={
              readOnly
                ? undefined
                : (ids) => {
                    onAnswerChange?.(model.formItemId, ids);
                  }
            }
          />
        </div>
      );
      break;
    }
    case 'fill_in_blank': {
      const text = normalizeFillInBlankValue(answerValue);
      body = (
        <div className="mt-4">
          <QuizFillInBlankQuestion
            value={text}
            readOnly={readOnly}
            onChange={
              readOnly
                ? undefined
                : (next) => {
                    onAnswerChange?.(model.formItemId, next);
                  }
            }
          />
        </div>
      );
      break;
    }
  }

  // Check if this question has any explanation content
  const hasExplanationContent =
    showExplanation &&
    (model.explanation.length > 0 ||
      Object.values(model.optionExplanations).some((e) => e.length > 0));

  // Render explanation panel
  const renderExplanationPanel = () => {
    if (!showExplanationDetail || !hasExplanationContent) return null;

    return (
      <div className="mt-4 rounded-md bg-blue-50 p-3 border border-blue-200">
        <Typography.Text strong className="text-blue-700 text-sm">
          Giải thích
        </Typography.Text>

        {model.explanation ? (
          <div className="mt-2 text-sm text-gray-700">
            <QaArticleHtml html={model.explanation} />
          </div>
        ) : null}

        {Object.keys(model.optionExplanations).length > 0 && (
          <div className="mt-3 space-y-2">
            <Typography.Text strong className="text-xs text-gray-600">
              Giải thích các lựa chọn:
            </Typography.Text>
            {optionsWithExplanations.map((opt) => {
              const optExplanation = model.optionExplanations[opt.id];
              if (!optExplanation) return null;

              return (
                <div key={opt.id} className="flex items-start gap-2 text-sm">
                  <Typography.Text className="mt-0.5 flex-shrink-0">
                    {opt.isSelected ? (
                      <RightCircleOutlined className="text-green-600" />
                    ) : (
                      <span className="w-4 h-4 inline-block" />
                    )}
                  </Typography.Text>
                  <div>
                    <Typography.Text type="secondary">{opt.html}</Typography.Text>
                    <div className="text-gray-600 text-xs mt-0.5">
                      <QaArticleHtml html={optExplanation} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const card = (
    <Card
      size="small"
      className={
        listeningHighlight
          ? 'border-orange-400 ring-2 ring-orange-500 ring-offset-2 transition-shadow duration-300'
          : 'border-neutral-200 hover:border-neutral-300'
      }
    >
      <div className="flex items-center gap-2">
        <Typography.Text
          strong
          className={listeningHighlight ? 'text-red-600' : undefined}
        >
          {model.heading}
        </Typography.Text>
        {isCorrect === true ? (
          <CheckCircleFilled className="text-base text-green-600" />
        ) : isCorrect === false ? (
          <CloseCircleFilled className="text-base text-red-600" />
        ) : null}
        {listeningHighlight ? (
          <SoundFilled className="text-base text-red-500 animate-pulse" title="Đang phát âm thanh" />
        ) : null}
      </div>
      <div className="mt-3">
        <QaArticleHtml html={model.stemHtml} />
      </div>
      {canListen ? (
        <QuizHiddenListeningPlayer
          tracks={audioTracks}
          canPlay={rem > 0}
          onPlaylistRoundCompleted={handleListeningRoundDone}
        />
      ) : null}
      {body}

      {/* Explanation button - only in result view with explanation content */}
      {hasExplanationContent && (
        <div className="mt-3">
          <Button
            type="link"
            size="small"
            onClick={toggleExplanation}
            className="text-blue-600 p-0 h-auto"
          >
            {showExplanationDetail ? 'Ẩn giải thích' : 'Xem giải thích'}
          </Button>
        </div>
      )}

      {renderExplanationPanel()}
    </Card>
  );

  if (scrollAnchorId) {
    return (
      <div id={scrollAnchorId} className="scroll-mt-28">
        {card}
      </div>
    );
  }

  return card;
});

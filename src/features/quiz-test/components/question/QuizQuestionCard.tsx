'use client';

import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { QuizFormItemPayload } from '@/features/quiz-test/types';
import {
  normalizeFillInBlankValue,
  normalizeMcqMultipleValue,
  normalizeMcqSingleValue,
} from '@/features/quiz-test/question-view';
import { buildQuizQuestionViewModel } from '@/features/quiz-test/lib/quiz-question-model';
import { Card, Typography } from 'antd';
import { memo, useMemo } from 'react';
import type { ReactNode } from 'react';

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
};

const DEFAULT_UNSUPPORTED_EDIT =
  'Đề này có câu chưa hỗ trợ làm trắc nghiệm trên cổng học viên.';
const DEFAULT_UNSUPPORTED_VIEW = 'Dạng câu không có đáp án trắc nghiệm.';

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
}: QuizQuestionCardProps) {
  const model = useMemo(
    () => buildQuizQuestionViewModel(row, questionIndex),
    [row, questionIndex],
  );

  if (!model) return null;

  const unsupportedCopy =
    unsupportedHint ?? (readOnly ? DEFAULT_UNSUPPORTED_VIEW : DEFAULT_UNSUPPORTED_EDIT);

  let body: ReactNode = null;
  switch (model.kind) {
    case 'unsupported':
      body = <QuizUnsupportedQuestionBody message={unsupportedCopy} />;
      break;
    case 'mcq_single': {
      const selectedOptionId = normalizeMcqSingleValue(answerValue);
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
      const selectedOptionIds = normalizeMcqMultipleValue(answerValue);
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

  return (
    <Card size="small">
      <div className="flex items-center gap-2">
        <Typography.Text strong>{model.heading}</Typography.Text>
        {isCorrect === true ? (
          <CheckCircleFilled className="text-base text-green-600" />
        ) : isCorrect === false ? (
          <CloseCircleFilled className="text-base text-red-600" />
        ) : null}
      </div>
      <div className="mt-3">
        <QaArticleHtml html={model.stemHtml} />
      </div>
      {body}
    </Card>
  );
});

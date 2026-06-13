'use client';

import { Input } from 'antd';
import { memo } from 'react';
import { FillBlankAcceptedAnswersList } from '@/features/quiz-test/components/FillBlankAcceptedAnswersList';
import {
  resolveFillBlankInputResultClass,
  shouldShowFillBlankAcceptedAnswers,
} from '@/features/quiz-test/lib/fill-blank-result-display';

export type QuizFillInBlankQuestionProps = {
  value: string;
  readOnly: boolean;
  onChange?: (next: string) => void;
  /** Hiển thị kết quả (đúng/sai + đáp án chấp nhận) */
  showResult?: boolean;
  /** Câu này có đúng không */
  isCorrect?: boolean;
  /** Đáp án chấp nhận — SSOT từ `grading.correctOptionIds` (fill-in-blank). */
  acceptedAnswers?: string[];
};

/** Một ô nhập — đáp án lưu dạng chuỗi trong `answersByFormItemId`. */
export const QuizFillInBlankQuestion = memo(function QuizFillInBlankQuestion({
  value,
  readOnly,
  onChange,
  showResult = false,
  isCorrect,
  acceptedAnswers = [],
}: QuizFillInBlankQuestionProps) {
  const showAccepted = shouldShowFillBlankAcceptedAnswers(
    showResult,
    readOnly,
    acceptedAnswers,
  );

  return (
    <div className="space-y-2">
      <Input
        value={value}
        readOnly={readOnly}
        placeholder={readOnly ? undefined : 'Nhập đáp án'}
        onChange={(e) => onChange?.(e.target.value)}
        className={resolveFillBlankInputResultClass({
          showResult,
          readOnly,
          isCorrect,
          value,
        })}
      />
      {showAccepted ? (
        <FillBlankAcceptedAnswersList texts={acceptedAnswers} />
      ) : null}
    </div>
  );
});

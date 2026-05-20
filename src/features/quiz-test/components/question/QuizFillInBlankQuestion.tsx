'use client';

import { Input } from 'antd';
import { memo } from 'react';

export type QuizFillInBlankQuestionProps = {
  value: string;
  readOnly: boolean;
  onChange?: (next: string) => void;
  /** Hiển thị kết quả (đúng/sai cho câu fill-in-blank) */
  showResult?: boolean;
  /** Câu này có đúng không */
  isCorrect?: boolean;
};

/** Một ô nhập — đáp án lưu dạng chuỗi trong `answersByFormItemId`. */
export const QuizFillInBlankQuestion = memo(function QuizFillInBlankQuestion({
  value,
  readOnly,
  onChange,
  showResult = false,
  isCorrect,
}: QuizFillInBlankQuestionProps) {
  return (
    <Input
      value={value}
      readOnly={readOnly}
      placeholder={readOnly ? undefined : 'Nhập đáp án'}
      onChange={(e) => onChange?.(e.target.value)}
      className="max-w-xl"
    />
  );
});

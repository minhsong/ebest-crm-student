'use client';

import { QuizMcqOptionLabel } from '@/features/quiz-test/quiz-mcq-option-label';
import { optionDisplayLetter } from '@/features/quiz-test/question-view';
import { Radio } from 'antd';
import { memo } from 'react';

import type { QuizMcqSingleQuestionProps } from './quiz-question.types';

/** MCQ một lựa chọn — chỉ UI, không gắn dữ liệu form container. */
export const QuizMcqSingleQuestion = memo(function QuizMcqSingleQuestion({
  options,
  selectedOptionId,
  readOnly,
  onChange,
}: QuizMcqSingleQuestionProps) {
  return (
    <Radio.Group
      value={selectedOptionId}
      onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
      className="flex w-full flex-col gap-2"
    >
      {options.map((op, idx) => (
        <Radio
          key={op.id}
          value={op.id}
          className="items-start whitespace-normal [&_.ant-radio]:top-1"
        >
          <QuizMcqOptionLabel letter={optionDisplayLetter(idx)} html={op.html} />
        </Radio>
      ))}
    </Radio.Group>
  );
});

'use client';

import { QuizMcqOptionLabel } from '@/features/quiz-test/quiz-mcq-option-label';
import { optionDisplayLetter } from '@/features/quiz-test/question-view';
import { Checkbox } from 'antd';
import { memo } from 'react';

import type { QuizMcqMultipleQuestionProps } from './quiz-question.types';

/** MCQ nhiều lựa chọn — chỉ UI. */
export const QuizMcqMultipleQuestion = memo(function QuizMcqMultipleQuestion({
  options,
  selectedOptionIds,
  readOnly,
  onChange,
}: QuizMcqMultipleQuestionProps) {
  return (
    <Checkbox.Group
      value={selectedOptionIds}
      onChange={readOnly ? undefined : (chs) => onChange?.(chs as string[])}
      className="flex w-full flex-col gap-2"
    >
      {options.map((op, idx) => (
        <Checkbox
          key={op.id}
          value={op.id}
          className="items-start whitespace-normal [&_.ant-checkbox]:top-1"
        >
          <QuizMcqOptionLabel letter={optionDisplayLetter(idx)} html={op.html} />
        </Checkbox>
      ))}
    </Checkbox.Group>
  );
});

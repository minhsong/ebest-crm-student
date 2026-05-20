'use client';

import { QuizMcqOptionLabel } from '@/features/quiz-test/quiz-mcq-option-label';
import { optionDisplayLetter, quizOptionIsCorrect } from '@/features/quiz-test/question-view';
import { QuizResultCorrectIcon } from '@/features/quiz-test/components/question/quiz-result-icons';
import { Radio } from 'antd';
import { memo } from 'react';

import type { QuizMcqSingleQuestionProps } from './quiz-question.types';

/** MCQ một lựa chọn — chỉ UI, không gắn dữ liệu form container. */
export const QuizMcqSingleQuestion = memo(function QuizMcqSingleQuestion({
  options,
  selectedOptionId,
  readOnly,
  onChange,
  correctOptionIds = [],
  showResult = false,
}: QuizMcqSingleQuestionProps) {
  return (
    <Radio.Group
      value={selectedOptionId}
      onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
      className="flex w-full flex-col gap-2"
    >
      {options.map((op, idx) => {
        const isCorrectOption = quizOptionIsCorrect(op.id, correctOptionIds);

        return (
          <Radio
            key={op.id}
            value={op.id}
            className="items-start whitespace-normal w-full [&_.ant-radio]:top-1 [&>span:last-child]:flex-1 [&>span:last-child]:pr-0"
          >
            <span className="flex w-full items-start justify-between gap-3">
              <QuizMcqOptionLabel letter={optionDisplayLetter(idx)} html={op.html} />
              {showResult && readOnly && isCorrectOption ? (
                <QuizResultCorrectIcon
                  size={16}
                  className="flex-shrink-0 mt-0.5"
                />
              ) : null}
            </span>
          </Radio>
        );
      })}
    </Radio.Group>
  );
});

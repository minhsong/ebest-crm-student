'use client';

import { QuizMcqOptionLabel } from '@/features/quiz-test/quiz-mcq-option-label';
import { optionDisplayLetter, quizOptionIsCorrect } from '@/features/quiz-test/question-view';
import { QuizResultCorrectIcon } from '@/features/quiz-test/components/question/quiz-result-icons';
import { Checkbox } from 'antd';
import { memo } from 'react';

import type { QuizMcqMultipleQuestionProps } from './quiz-question.types';

/** MCQ nhiều lựa chọn — chỉ UI. */
export const QuizMcqMultipleQuestion = memo(function QuizMcqMultipleQuestion({
  options,
  selectedOptionIds,
  readOnly,
  onChange,
  correctOptionIds = [],
  showResult = false,
}: QuizMcqMultipleQuestionProps) {
  return (
    <Checkbox.Group
      value={selectedOptionIds}
      onChange={readOnly ? undefined : (chs) => onChange?.(chs as string[])}
      className="flex w-full flex-col gap-2"
    >
      {options.map((op, idx) => {
        const isCorrectOption = quizOptionIsCorrect(op.id, correctOptionIds);

        return (
          <Checkbox
            key={op.id}
            value={op.id}
            className="items-start whitespace-normal w-full [&_.ant-checkbox]:top-1 [&>span:last-child]:flex-1 [&>span:last-child]:pr-0"
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
          </Checkbox>
        );
      })}
    </Checkbox.Group>
  );
});

'use client';

import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { QuizFormItemPayload } from '@/features/quiz-test/types';
import { Card, Typography } from 'antd';
import { memo } from 'react';

import { QuizQuestionCard } from './QuizQuestionCard';

export type QuizQuestionBundleCardProps = {
  title?: string;
  stemHtml?: string | null;
  items: QuizFormItemPayload[];
  startQuestionIndex: number;
  answerMap: Record<string, unknown>;
  readOnly: boolean;
  onAnswerChange?: (formItemId: string, next: string | string[]) => void;
  correctByFormItemId?: Record<string, boolean>;
};

/** Component quản lý UI cho bundle; câu con tái sử dụng `QuizQuestionCard`. */
export const QuizQuestionBundleCard = memo(function QuizQuestionBundleCard({
  title = 'Nhóm câu hỏi',
  stemHtml,
  items,
  startQuestionIndex,
  answerMap,
  readOnly,
  onAnswerChange,
  correctByFormItemId,
}: QuizQuestionBundleCardProps) {
  if (!items.length) return null;
  return (
    <Card size="small" className="border-neutral-300 bg-neutral-50/40">
      <Typography.Text strong className="text-base">
        {title}
      </Typography.Text>
      {stemHtml ? (
        <div className="mt-2">
          <QaArticleHtml html={stemHtml} />
        </div>
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
          />
        ))}
      </div>
    </Card>
  );
});


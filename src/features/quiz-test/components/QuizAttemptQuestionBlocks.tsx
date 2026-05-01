'use client';

import {
  QuizQuestionBundleCard,
  QuizQuestionCard,
} from '@/features/quiz-test/components/question';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';

type QuizAttemptQuestionBlocksProps = {
  renderBlocks: QuizRenderableBlock[];
  blockStartIndexes: number[];
  answers: Record<string, unknown>;
  readOnly: boolean;
  onAnswerChange?: (formItemId: string, value: string | string[]) => void;
  correctByFormItemId?: Record<string, boolean>;
};

export function QuizAttemptQuestionBlocks({
  renderBlocks,
  blockStartIndexes,
  answers,
  readOnly,
  onAnswerChange,
  correctByFormItemId,
}: QuizAttemptQuestionBlocksProps) {
  return (
    <>
      {renderBlocks.map((block, blockIdx) => {
        const startIdx = blockStartIndexes[blockIdx] ?? 0;
        if (block.kind === 'single') {
          const row = block.item;
          const key = String(row.formItemId);
          return (
            <QuizQuestionCard
              key={key}
              row={row}
              questionIndex={startIdx}
              answerValue={answers[key] as string | string[] | undefined}
              readOnly={readOnly}
              onAnswerChange={onAnswerChange}
              isCorrect={correctByFormItemId?.[key]}
            />
          );
        }
        return (
          <QuizQuestionBundleCard
            key={block.bundleKey}
            title={`Nhóm câu hỏi #${block.sourceGroupId}`}
            stemHtml={block.stemHtml}
            items={block.items}
            startQuestionIndex={startIdx}
            answerMap={answers as Record<string, string | string[]>}
            readOnly={readOnly}
            onAnswerChange={onAnswerChange}
            correctByFormItemId={correctByFormItemId}
          />
        );
      })}
    </>
  );
}

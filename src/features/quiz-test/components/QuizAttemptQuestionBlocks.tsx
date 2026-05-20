'use client';

import {
  QuizQuestionBundleCard,
  QuizQuestionCard,
} from '@/features/quiz-test/components/question';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import type { QuizGradingPerItem } from '@/features/quiz-test/lib/quiz-runtime-view';
import { quizAnchorDomId } from '@/features/quiz-test/lib/quiz-section-navigation';

type QuizAttemptQuestionBlocksProps = {
  renderBlocks: QuizRenderableBlock[];
  blockStartIndexes: number[];
  answers: Record<string, unknown>;
  readOnly: boolean;
  onAnswerChange?: (formItemId: string, value: string | string[]) => void;
  correctByFormItemId?: Record<string, boolean>;
  /** Detailed grading per item (includes correctOptionIds, selectedOptionIds) */
  gradingPerItem?: Record<string, QuizGradingPerItem | undefined>;
  listeningRemaining?: Record<string, number>;
  reportListeningCycle?: (formItemKey: string) => Promise<void>;
  /** Key formItemId / bundle parent — highlight khi section player đang phát. */
  listeningHighlightKey?: string | null;
  /** `false`: ẩn player từng cây (dùng section orchestrator). */
  embedListeningPlayer?: boolean;
  /** Cho phép hiển thị giải thích */
  showExplanation?: boolean;
};

export function QuizAttemptQuestionBlocks({
  renderBlocks,
  blockStartIndexes,
  answers,
  readOnly,
  onAnswerChange,
  correctByFormItemId,
  gradingPerItem,
  listeningRemaining,
  reportListeningCycle,
  listeningHighlightKey,
  embedListeningPlayer = true,
  showExplanation = false,
}: QuizAttemptQuestionBlocksProps) {
  return (
    <>
      {renderBlocks.map((block, blockIdx) => {
        const startIdx = blockStartIndexes[blockIdx] ?? 0;
        if (block.kind === 'single') {
          const row = block.item;
          const key = String(row.formItemId);
          const itemGrading = gradingPerItem?.[key];
          return (
            <QuizQuestionCard
              key={key}
              row={row}
              questionIndex={startIdx}
              answerValue={answers[key] as string | string[] | undefined}
              readOnly={readOnly}
              onAnswerChange={onAnswerChange}
              isCorrect={correctByFormItemId?.[key]}
              grading={itemGrading}
              questionContent={row.questionSnapshot?.content as Record<string, unknown> | undefined}
              listeningUnitKey={key}
              listeningRemaining={listeningRemaining?.[key]}
              reportListeningCycle={reportListeningCycle}
              scrollAnchorId={quizAnchorDomId(key)}
              listeningHighlight={listeningHighlightKey === key}
              embedListeningPlayer={embedListeningPlayer}
              showExplanation={showExplanation}
            />
          );
        }
        return (
          <QuizQuestionBundleCard
            key={block.bundleKey}
            title={`Nhóm câu hỏi #${block.sourceGroupId}`}
            stemHtml={block.stemHtml}
            bundleContent={block.bundleContent}
            items={block.items}
            startQuestionIndex={startIdx}
            answerMap={answers as Record<string, string | string[]>}
            readOnly={readOnly}
            onAnswerChange={onAnswerChange}
            correctByFormItemId={correctByFormItemId}
            gradingPerItem={gradingPerItem}
            listeningUnitKey={String(block.parentFormItemId)}
            listeningRemaining={listeningRemaining?.[String(block.parentFormItemId)]}
            reportListeningCycle={reportListeningCycle}
            bundleAnchorId={quizAnchorDomId(String(block.parentFormItemId))}
            listeningHighlight={listeningHighlightKey === String(block.parentFormItemId)}
            embedListeningPlayer={embedListeningPlayer}
            showExplanation={showExplanation}
          />
        );
      })}
    </>
  );
}

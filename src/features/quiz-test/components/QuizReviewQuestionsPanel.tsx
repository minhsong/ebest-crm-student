'use client';

import { useMemo, useState } from 'react';
import { Collapse } from 'antd';
import { QuizAttemptQuestionBlocks } from '@/features/quiz-test/components/QuizAttemptQuestionBlocks';
import { QuizSectionInstructionsBlock } from '@/features/quiz-test/components/QuizSectionInstructionsBlock';
import { filterRenderableBlocksBySectionId } from '@/features/quiz-test/lib/quiz-renderable-items';
import { buildBlockStartIndexes } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizReviewViewModel } from '@/features/quiz-test/lib/quiz-review-view-model';

export type QuizReviewQuestionsPanelProps = {
  viewModel: QuizReviewViewModel;
  defaultExpandAllSections?: boolean;
  embedListeningPlayer?: boolean;
  collapseActiveKeys?: string[];
  onCollapseActiveKeysChange?: (keys: string[]) => void;
};

export function QuizReviewQuestionsPanel({
  viewModel,
  defaultExpandAllSections = true,
  embedListeningPlayer = true,
  collapseActiveKeys,
  onCollapseActiveKeysChange,
}: QuizReviewQuestionsPanelProps) {
  const {
    formPayload,
    renderBlocks,
    blockStartIndexes,
    sectionsOrdered,
    allSectionKeys,
    answers,
    correctByFormItemId,
    gradingPerItem,
    showExplanationOnReview,
  } = viewModel;

  const [internalOpenKeys, setInternalOpenKeys] = useState<string[]>([]);
  const isControlled = collapseActiveKeys !== undefined;

  const activeKeys = useMemo(() => {
    if (sectionsOrdered.length <= 1) return [];
    if (isControlled) {
      return collapseActiveKeys.length > 0
        ? collapseActiveKeys
        : defaultExpandAllSections
          ? allSectionKeys
          : [];
    }
    if (internalOpenKeys.length > 0) return internalOpenKeys;
    return defaultExpandAllSections ? allSectionKeys : [];
  }, [
    allSectionKeys,
    collapseActiveKeys,
    defaultExpandAllSections,
    internalOpenKeys,
    isControlled,
    sectionsOrdered.length,
  ]);

  const handleCollapseChange = (k: string | string[]) => {
    const next = Array.isArray(k) ? k : [String(k)];
    if (isControlled) {
      onCollapseActiveKeysChange?.(next);
    } else {
      setInternalOpenKeys(next);
    }
  };

  if (sectionsOrdered.length <= 1) {
    const loneSection = sectionsOrdered[0];
    return (
      <div className="space-y-3">
        <QuizSectionInstructionsBlock section={loneSection} />
        <QuizAttemptQuestionBlocks
          renderBlocks={renderBlocks}
          blockStartIndexes={blockStartIndexes}
          answers={answers}
          readOnly
          correctByFormItemId={correctByFormItemId}
          gradingPerItem={gradingPerItem}
          showExplanation={showExplanationOnReview}
          embedListeningPlayer={embedListeningPlayer}
        />
      </div>
    );
  }

  return (
    <Collapse
      bordered={false}
      activeKey={activeKeys}
      onChange={handleCollapseChange}
      items={sectionsOrdered.map((sec) => {
        const blocks = filterRenderableBlocksBySectionId(
          formPayload,
          renderBlocks,
          sec.sectionId,
        );
        const idx = buildBlockStartIndexes(blocks);
        return {
          key: String(sec.sectionId),
          label: sec.title?.trim() || `Phần ${sec.order + 1}`,
          children: (
            <div className="space-y-3">
              <QuizSectionInstructionsBlock section={sec} />
              <QuizAttemptQuestionBlocks
                renderBlocks={blocks}
                blockStartIndexes={idx}
                answers={answers}
                readOnly
                correctByFormItemId={correctByFormItemId}
                gradingPerItem={gradingPerItem}
                showExplanation={showExplanationOnReview}
                embedListeningPlayer={embedListeningPlayer}
              />
            </div>
          ),
        };
      })}
    />
  );
}

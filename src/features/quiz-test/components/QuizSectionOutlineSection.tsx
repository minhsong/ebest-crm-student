'use client';

import type { QuizOutlineSectionGroup, QuizSectionOutlineMode } from '@/features/quiz-test/lib/quiz-section-outline.util';
import {
  getQuizOutlineQuestionButtonClassName,
  isQuizOutlineSectionNavigationLocked,
  resolveQuizOutlineQuestionButtonVariant,
} from '@/features/quiz-test/lib/quiz-section-outline.util';
import { Typography } from 'antd';

export type QuizSectionOutlineSectionProps = {
  group: QuizOutlineSectionGroup;
  mode: QuizSectionOutlineMode;
  answers?: Record<string, unknown>;
  correctByFormItemId?: Record<string, boolean>;
  activeQuestionKey?: string | null;
  navigationLocked?: boolean;
  lockedSectionId?: number | null;
  onNavigateToQuestion: (sectionId: number | null, formItemId: string) => void;
};

export function QuizSectionOutlineSection({
  group,
  mode,
  answers,
  correctByFormItemId,
  activeQuestionKey,
  navigationLocked,
  lockedSectionId,
  onNavigateToQuestion,
}: QuizSectionOutlineSectionProps) {
  const sectionLocked = isQuizOutlineSectionNavigationLocked(
    navigationLocked,
    group.sectionId,
    lockedSectionId,
  );

  return (
    <section className="quiz-outline-section">
      <Typography.Text className="quiz-outline-section__title">
        {group.sectionTitle}
      </Typography.Text>
      <div className="quiz-outline-section__grid">
        {group.questions.map((question) => {
          const variant = resolveQuizOutlineQuestionButtonVariant(
            mode,
            question.formItemId,
            answers,
            correctByFormItemId,
          );
          const isActive = question.formItemId === activeQuestionKey;
          return (
            <button
              key={question.formItemId}
              type="button"
              disabled={sectionLocked}
              className={getQuizOutlineQuestionButtonClassName(variant, isActive)}
              aria-label={`Câu ${question.displayNumber}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => {
                if (sectionLocked) return;
                onNavigateToQuestion(group.sectionId, question.formItemId);
              }}
            >
              {question.displayNumber}
            </button>
          );
        })}
      </div>
    </section>
  );
}

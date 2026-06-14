'use client';

import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  QUIZ_SECTION_OUTLINE_DRAWER_TITLE,
  type QuizSectionOutlineMode,
} from '@/features/quiz-test/lib/quiz-section-outline.util';
import { QuizSectionOutlineSection } from '@/features/quiz-test/components/QuizSectionOutlineSection';
import { useQuizSectionOutline } from '@/features/quiz-test/hooks/useQuizSectionOutline';
import { Drawer } from 'antd';
import '@/features/quiz-test/components/quiz-section-outline-drawer.css';

export type { QuizSectionOutlineMode } from '@/features/quiz-test/lib/quiz-section-outline.util';

export type QuizSectionOutlineDrawerProps = {
  open: boolean;
  onClose: () => void;
  formPayload: QuizPublishedFormPayload;
  allRenderBlocks: QuizRenderableBlock[];
  /** formItemId câu đang xem — khớp query `?question=`. */
  activeQuestionKey?: string | null;
  onNavigateToQuestion: (sectionId: number | null, formItemId: string) => void;
  mode?: QuizSectionOutlineMode;
  answers?: Record<string, unknown>;
  correctByFormItemId?: Record<string, boolean>;
  navigationLocked?: boolean;
  lockedSectionId?: number | null;
};

/**
 * Drawer mục lục: theo phần → lưới nút số câu (nhảy tới câu, màu theo trạng thái).
 */
export function QuizSectionOutlineDrawer({
  open,
  onClose,
  formPayload,
  allRenderBlocks,
  activeQuestionKey,
  onNavigateToQuestion,
  mode = 'attempt',
  answers,
  correctByFormItemId,
  navigationLocked,
  lockedSectionId,
}: QuizSectionOutlineDrawerProps) {
  const { sectionGroups } = useQuizSectionOutline(formPayload, allRenderBlocks, {
    enabled: true,
  });

  return (
    <Drawer
      title={QUIZ_SECTION_OUTLINE_DRAWER_TITLE}
      placement="right"
      width={320}
      onClose={onClose}
      open={open}
    >
      <div className="quiz-outline-sections">
        {sectionGroups.map((group) => (
          <QuizSectionOutlineSection
            key={`${group.sectionId ?? 'all'}-${group.sectionTitle}`}
            group={group}
            mode={mode}
            answers={answers}
            correctByFormItemId={correctByFormItemId}
            activeQuestionKey={activeQuestionKey}
            navigationLocked={navigationLocked}
            lockedSectionId={lockedSectionId}
            onNavigateToQuestion={onNavigateToQuestion}
          />
        ))}
      </div>
    </Drawer>
  );
}

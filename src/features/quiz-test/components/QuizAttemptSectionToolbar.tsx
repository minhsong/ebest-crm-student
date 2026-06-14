'use client';

import { QuizAttemptOutlineToggleButton } from '@/features/quiz-test/components/QuizAttemptOutlineToggleButton';

export type QuizAttemptSectionToolbarProps = {
  showOutline: boolean;
  outlineOpen: boolean;
  onToggleOutline: () => void;
};

/** Toolbar mục lục độc lập — trang kết quả khi chưa gộp header. */
export function QuizAttemptSectionToolbar({
  showOutline,
  outlineOpen,
  onToggleOutline,
}: QuizAttemptSectionToolbarProps) {
  if (!showOutline) return null;

  return (
    <div className="quiz-attempt-section-toolbar">
      <QuizAttemptOutlineToggleButton
        outlineOpen={outlineOpen}
        onToggleOutline={onToggleOutline}
        variant="below"
      />
    </div>
  );
}

export { QuizAttemptOutlineToggleButton } from '@/features/quiz-test/components/QuizAttemptOutlineToggleButton';
export type {
  QuizAttemptOutlineToggleButtonProps,
  QuizAttemptOutlineToggleVariant,
} from '@/features/quiz-test/components/QuizAttemptOutlineToggleButton';

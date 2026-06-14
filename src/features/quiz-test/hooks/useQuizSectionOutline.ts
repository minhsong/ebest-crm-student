'use client';

import { useMemo } from 'react';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import {
  buildQuizOutlineSectionGroups,
  shouldShowQuizSectionOutline,
  type QuizOutlineSectionGroup,
} from '@/features/quiz-test/lib/quiz-section-outline.util';

export type UseQuizSectionOutlineOptions = {
  /** Khi false — luôn ẩn mục lục (vd. thiếu handler navigate). */
  enabled?: boolean;
  /** Số phần trên form — override khi đã có `sections` sorted sẵn. */
  sectionCount?: number;
};

export type UseQuizSectionOutlineResult = {
  sectionGroups: QuizOutlineSectionGroup[];
  showOutline: boolean;
};

/** SSOT: hiển thị drawer mục lục + nhóm section/câu. */
export function useQuizSectionOutline(
  formPayload: QuizPublishedFormPayload | null | undefined,
  allRenderBlocks: QuizRenderableBlock[] | undefined,
  options?: UseQuizSectionOutlineOptions,
): UseQuizSectionOutlineResult {
  const sectionGroups = useMemo(() => {
    if (!formPayload || !allRenderBlocks?.length) return [];
    return buildQuizOutlineSectionGroups(formPayload, allRenderBlocks);
  }, [allRenderBlocks, formPayload]);

  const showOutline = useMemo(() => {
    if (options?.enabled === false) return false;
    if (!formPayload || !allRenderBlocks?.length) return false;
    return shouldShowQuizSectionOutline(formPayload, allRenderBlocks, {
      sectionCount: options?.sectionCount,
    });
  }, [
    allRenderBlocks,
    formPayload,
    options?.enabled,
    options?.sectionCount,
  ]);

  return { sectionGroups, showOutline };
}

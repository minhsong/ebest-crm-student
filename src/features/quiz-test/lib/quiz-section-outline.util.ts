import {
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import { isQuizAnswerFilled } from '@/features/quiz-test/lib/quiz-attempt-progress.util';
import { buildBlockStartIndexes } from '@/features/quiz-test/lib/quiz-runtime-view';
import {
  findQuizFormSection,
  resolveQuizSectionNavMeta,
  sortQuizFormSections,
} from '@/features/quiz-test/lib/quiz-section-meta';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';

export const QUIZ_SECTION_OUTLINE_DRAWER_TITLE = 'Mục lục phần / câu';

export type QuizSectionOutlineMode = 'attempt' | 'review';

export type QuizOutlineQuestionButtonVariant =
  | 'default'
  | 'answered'
  | 'correct'
  | 'incorrect';

export type QuizOutlineQuestionItem = {
  formItemId: string;
  /** Số thứ tự hiển thị (1-based, toàn đề). */
  displayNumber: number;
};

export type QuizOutlineSectionGroup = {
  sectionId: number | null;
  sectionTitle: string;
  questions: QuizOutlineQuestionItem[];
};

function outlineBlockKey(block: QuizRenderableBlock): string {
  if (block.kind === 'single') return `s:${String(block.item.formItemId)}`;
  return `b:${block.bundleKey}`;
}

function expandBlockToOutlineQuestions(
  block: QuizRenderableBlock,
  globalBlockIndex: number,
  starts: number[],
): QuizOutlineQuestionItem[] {
  const base = starts[globalBlockIndex] ?? 0;
  if (block.kind === 'single') {
    return [
      {
        formItemId: String(block.item.formItemId),
        displayNumber: base + 1,
      },
    ];
  }
  return block.items.map((item, i) => ({
    formItemId: String(item.formItemId),
    displayNumber: base + i + 1,
  }));
}

/** Nhóm mục lục: section → danh sách câu đánh số. */
export function buildQuizOutlineSectionGroups(
  formPayload: QuizPublishedFormPayload,
  allRenderBlocks: QuizRenderableBlock[],
): QuizOutlineSectionGroup[] {
  const sections = sortQuizFormSections(formPayload?.sections);
  const starts = buildBlockStartIndexes(allRenderBlocks);

  if (!sections.length) {
    const questions = allRenderBlocks.flatMap((block, i) =>
      expandBlockToOutlineQuestions(block, i, starts),
    );
    return questions.length
      ? [{ sectionId: null, sectionTitle: 'Toàn bài', questions }]
      : [];
  }

  const groups: QuizOutlineSectionGroup[] = [];
  for (const sec of sections) {
    const sid = Number(sec.sectionId);
    if (!Number.isFinite(sid)) continue;
    const blocks = filterRenderableBlocksBySectionId(formPayload, allRenderBlocks, sid);
    const questions: QuizOutlineQuestionItem[] = [];
    for (const block of blocks) {
      const gi = allRenderBlocks.findIndex(
        (x) => outlineBlockKey(x) === outlineBlockKey(block),
      );
      if (gi >= 0) {
        questions.push(...expandBlockToOutlineQuestions(block, gi, starts));
      }
    }
    if (!questions.length) continue;
    const secMeta = findQuizFormSection(sections, sid);
    const { idx: sectionIdx } = resolveQuizSectionNavMeta(sections, sid);
    groups.push({
      sectionId: sid,
      sectionTitle:
        secMeta?.title?.trim() ||
        sec.title?.trim() ||
        `Phần ${sectionIdx >= 0 ? sectionIdx + 1 : 1}`,
      questions,
    });
  }
  return groups;
}

export function countQuizOutlineQuestions(groups: QuizOutlineSectionGroup[]): number {
  return groups.reduce((sum, group) => sum + group.questions.length, 0);
}

export function shouldShowQuizSectionOutline(
  formPayload: QuizPublishedFormPayload,
  allRenderBlocks: QuizRenderableBlock[],
  options?: { sectionCount?: number },
): boolean {
  const groups = buildQuizOutlineSectionGroups(formPayload, allRenderBlocks);
  const sectionCount = options?.sectionCount ?? groups.length;
  return (
    countQuizOutlineQuestions(groups) > 1 ||
    groups.length > 1 ||
    sectionCount > 1
  );
}

export function resolveQuizOutlineQuestionButtonVariant(
  mode: QuizSectionOutlineMode,
  formItemId: string,
  answers?: Record<string, unknown>,
  correctByFormItemId?: Record<string, boolean>,
): QuizOutlineQuestionButtonVariant {
  if (mode === 'review') {
    const isCorrect = correctByFormItemId?.[formItemId];
    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return 'default';
  }
  return isQuizAnswerFilled(answers?.[formItemId]) ? 'answered' : 'default';
}

export function getQuizOutlineQuestionButtonClassName(
  variant: QuizOutlineQuestionButtonVariant,
  isActive: boolean,
): string {
  const parts = ['quiz-outline-q-btn', `quiz-outline-q-btn--${variant}`];
  if (isActive) parts.push('quiz-outline-q-btn--active');
  return parts.join(' ');
}

export function isQuizOutlineSectionNavigationLocked(
  navigationLocked: boolean | undefined,
  groupSectionId: number | null,
  lockedSectionId: number | null | undefined,
): boolean {
  return !!navigationLocked && (groupSectionId ?? null) !== (lockedSectionId ?? null);
}

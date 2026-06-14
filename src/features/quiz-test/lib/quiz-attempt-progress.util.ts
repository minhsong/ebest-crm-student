import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';

/** Có đáp án hợp lệ (khớp logic Gateway khi chấm skipped/answered). */
export function isQuizAnswerFilled(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => String(entry).trim() !== '');
  }
  if (typeof value === 'string') return value.trim() !== '';
  return String(value).trim() !== '';
}

export function collectQuizFormItemIdsFromBlocks(
  blocks: QuizRenderableBlock[],
): string[] {
  const ids: string[] = [];
  for (const block of blocks) {
    if (block.kind === 'single') {
      ids.push(String(block.item.formItemId));
      continue;
    }
    for (const item of block.items) {
      ids.push(String(item.formItemId));
    }
  }
  return ids;
}

export type QuizAttemptAnswerProgress = {
  answeredCount: number;
  totalCount: number;
};

export function countQuizAttemptAnswerProgress(
  answers: Record<string, string | string[]>,
  blocks: QuizRenderableBlock[],
): QuizAttemptAnswerProgress {
  const ids = collectQuizFormItemIdsFromBlocks(blocks);
  let answeredCount = 0;
  for (const id of ids) {
    if (isQuizAnswerFilled(answers[id])) answeredCount += 1;
  }
  return { answeredCount, totalCount: ids.length };
}

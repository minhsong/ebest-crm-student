/** Hiển thị đáp án fill-in-blank — SSOT UI (xem kết quả quiz, đồng bộ CRM). */

export const FILL_BLANK_CORRECT_SURFACE_CLASS =
  'bg-[#f6ffed] border-[#b7eb8f] dark:bg-green-950/25 dark:border-green-700';

export const FILL_BLANK_ACCEPTED_ROW_CLASS =
  `flex items-center gap-2 border rounded px-2 py-1 ${FILL_BLANK_CORRECT_SURFACE_CLASS}`;

export const FILL_BLANK_CORRECT_ANSWERS_LABEL = 'Đáp án đúng';

export function nonEmptyTrimmedTexts(texts: readonly string[]): string[] {
  return texts.map((t) => t.trim()).filter(Boolean);
}

/** Runtime review: `grading.correctOptionIds` chứa text chấp nhận (Gateway SSOT). */
export function fillBlankAcceptedTextsFromGrading(
  grading?: { correctOptionIds?: string[] } | null,
): string[] {
  return nonEmptyTrimmedTexts(grading?.correctOptionIds ?? []);
}

export function shouldShowFillBlankAcceptedAnswers(
  showResult: boolean,
  readOnly: boolean,
  acceptedAnswers: readonly string[],
): boolean {
  return (
    showResult &&
    readOnly &&
    nonEmptyTrimmedTexts(acceptedAnswers).length > 0
  );
}

export function resolveFillBlankInputResultClass(params: {
  showResult: boolean;
  readOnly: boolean;
  isCorrect?: boolean;
  value: string;
  baseClass?: string;
}): string {
  const parts = [params.baseClass ?? 'max-w-xl'];
  if (params.showResult && params.readOnly) {
    if (params.isCorrect) {
      parts.push('border-green-500 bg-green-50/50');
    } else if (params.value.trim()) {
      parts.push('border-red-400 bg-red-50/50');
    }
  }
  return parts.filter(Boolean).join(' ');
}

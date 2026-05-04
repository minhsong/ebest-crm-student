/**
 * Pure logic: từ payload CRM → model UI (loại câu, stem, options).
 * Component chỉ render theo model — thêm loại câu mới: mở rộng `QuizQuestionUiKind` + renderer tương ứng.
 */

import type { QuizFormItemPayload } from '@/features/quiz-test/types';
import {
  formatQuizQuestionHeading,
  getQuizOptionsFromSnapshot,
  isMultipleChoiceQuestion,
  orderQuizOptionsByFormItem,
} from '@/features/quiz-test/question-view';

export type QuizMcqOption = { id: string; html: string };

/** Các loại UI đã hỗ trợ; thêm loại mới → thêm case trong `QuizQuestionCard`. */
export type QuizQuestionUiKind =
  | 'mcq_single'
  | 'mcq_multiple'
  | 'fill_in_blank'
  | 'unsupported';

export type QuizQuestionViewModel = {
  formItemId: string;
  heading: string;
  stemHtml: string;
  kind: QuizQuestionUiKind;
  options: QuizMcqOption[];
};

export function buildQuizQuestionViewModel(
  row: QuizFormItemPayload,
  zeroBasedIndex: number,
): QuizQuestionViewModel | null {
  const q = row.questionSnapshot;
  if (!q) return null;

  const content =
    typeof q.content === 'object' && q.content !== null
      ? (q.content as Record<string, unknown>)
      : undefined;

  const stem =
    typeof content?.stem === 'string'
      ? content.stem
      : '<p>Không có nội dung câu.</p>';

  const options = orderQuizOptionsByFormItem(
    getQuizOptionsFromSnapshot(content),
    row.optionOrder,
  );

  const qType = typeof q.questionType === 'string' ? q.questionType : null;
  const kind: QuizQuestionUiKind =
    qType === 'fill_in_blank'
      ? 'fill_in_blank'
      : options.length === 0
        ? 'unsupported'
        : isMultipleChoiceQuestion(qType)
          ? 'mcq_multiple'
          : 'mcq_single';

  return {
    formItemId: String(row.formItemId),
    heading: formatQuizQuestionHeading(
      {
        order: row.order,
        formItemId: row.formItemId,
        questionSnapshot: row.questionSnapshot,
      },
      zeroBasedIndex,
    ),
    stemHtml: stem,
    kind,
    options,
  };
}

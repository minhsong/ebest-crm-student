import type { QuizMcqOption } from '@/features/quiz-test/lib/quiz-question-model';

/** Props cho phần lựa chọn trắc nghiệm một đáp án. */
export type QuizMcqSingleQuestionProps = {
  options: QuizMcqOption[];
  selectedOptionId: string | undefined;
  readOnly: boolean;
  /** Chỉ gọi khi `readOnly === false`. */
  onChange?: (optionId: string) => void;
  /** Các option IDs đúng (để highlight khi xem kết quả) */
  correctOptionIds?: string[];
  /** Hiển thị kết quả (highlight đúng/sai) */
  showResult?: boolean;
};

/** Props cho phần lựa chọn trắc nghiệm nhiều đáp án. */
export type QuizMcqMultipleQuestionProps = {
  options: QuizMcqOption[];
  selectedOptionIds: string[] | undefined;
  readOnly: boolean;
  onChange?: (optionIds: string[]) => void;
  /** Các option IDs đúng (để highlight khi xem kết quả) */
  correctOptionIds?: string[];
  /** Hiển thị kết quả (highlight đúng/sai) */
  showResult?: boolean;
};

export type QuizUnsupportedQuestionBodyProps = {
  message: string;
};

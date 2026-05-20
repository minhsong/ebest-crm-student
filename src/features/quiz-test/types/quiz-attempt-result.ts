export type QuizAttemptResultSnapshot = {
  attemptPublicId: string;
  formPublicId: string;
  status: string;
  answersByFormItemId?: Record<string, unknown>;
  startedAt?: string;
  submittedAt?: string | null;
  expiresAt?: string;
  grading?: {
    summary?: {
      totalQuestions?: number;
      correctCount?: number;
      wrongCount?: number;
      accuracy?: number;
    };
    items?: Array<{
      formItemId?: string | number;
      isCorrect?: boolean;
      selectedOptionIds?: string[];
      correctOptionIds?: string[];
    }>;
  } | null;
};

import type { QuizResultEligibility } from '@/features/quiz-test/lib/quiz-result-view-policy';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';

/** @deprecated Dùng QuizResultEligibility */
export type AssignmentQuizEligibility = QuizResultEligibility;

export type AssignmentQuizActionState = {
  loading: boolean;
  error: string | null;
  canStart: boolean;
  startBlockReason: string | null;
  eligibility: QuizResultEligibility | null;
  submittedAttempts: QuizAttemptHistoryItem[];
  canViewResultDetail: boolean;
  /** @deprecated Dùng canViewResultDetail */
  canViewResults: boolean;
  resultsPageHref: string;
};

export type AssignmentQuizSnapshot = Pick<
  AssignmentQuizActionState,
  | 'canStart'
  | 'startBlockReason'
  | 'eligibility'
  | 'submittedAttempts'
  | 'canViewResultDetail'
  | 'canViewResults'
>;

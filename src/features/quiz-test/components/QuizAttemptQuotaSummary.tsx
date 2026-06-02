'use client';

import {
  formatQuizAttemptQuotaSummary,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { Alert } from 'antd';

type Props = {
  eligibility: QuizResultEligibility | null | undefined;
  /** Hiển thị khi chưa có lần nộp — vẫn show max attempts nếu có. */
  showWhenEmpty?: boolean;
};

export function QuizAttemptQuotaSummary({ eligibility, showWhenEmpty = true }: Props) {
  if (!eligibility) return null;
  if (!showWhenEmpty && eligibility.submittedCount <= 0 && eligibility.maxAttempts == null) {
    return null;
  }

  const summary = formatQuizAttemptQuotaSummary(eligibility);
  if (!summary) return null;

  const hasLimit = eligibility.maxAttempts != null;
  const remaining = eligibility.attemptsRemaining ?? null;
  const exhausted = hasLimit && remaining === 0;

  return (
    <Alert
      type={exhausted ? 'warning' : 'info'}
      showIcon
      message={hasLimit ? 'Giới hạn số lần làm bài' : 'Số lần làm bài'}
      description={summary}
    />
  );
}

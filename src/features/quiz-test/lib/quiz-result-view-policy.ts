export type QuizEligibilityFromCrm = {
  submittedCount: number;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
  hasPerfectScore: boolean;
};

export type CanViewResultReason =
  | 'eligible'
  | 'no_attempts'
  | 'not_all_attempts_used'
  | 'no_perfect_score';

export type CanViewResultData = {
  canView: boolean;
  reason: CanViewResultReason;
  attemptsUsed: number;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
  hasPerfectScore: boolean;
  submittedCount: number;
};

export type CanViewResultInput = {
  accessMode: 'assignment' | 'practice';
  attemptStatus: string;
  hasGradingItems: boolean;
  eligibility?: QuizEligibilityFromCrm | null;
  submittedAttemptsCount?: number;
};

/**
 * Quyết định hiển thị chi tiết đáp án trên trang xem kết quả (pure — không gọi API).
 */
export function computeCanViewResultDetails(input: CanViewResultInput): CanViewResultData {
  const submitted =
    input.attemptStatus === 'submitted' || input.attemptStatus === 'expired';
  const maxAttempts = input.eligibility?.maxAttempts ?? null;
  const submittedCount =
    input.eligibility?.submittedCount ?? input.submittedAttemptsCount ?? 0;
  const attemptsRemaining =
    input.eligibility?.attemptsRemaining ??
    (maxAttempts != null ? Math.max(0, maxAttempts - submittedCount) : null);
  const hasPerfectScore = Boolean(input.eligibility?.hasPerfectScore);

  if (input.accessMode === 'assignment' && submitted) {
    return {
      canView: true,
      reason: 'eligible',
      attemptsUsed: submittedCount,
      maxAttempts,
      attemptsRemaining,
      hasPerfectScore,
      submittedCount,
    };
  }

  if (submitted && input.hasGradingItems) {
    return {
      canView: true,
      reason: 'eligible',
      attemptsUsed: submittedCount,
      maxAttempts,
      attemptsRemaining,
      hasPerfectScore,
      submittedCount,
    };
  }

  if (submittedCount === 0) {
    return {
      canView: false,
      reason: 'no_attempts',
      attemptsUsed: 0,
      maxAttempts,
      attemptsRemaining,
      hasPerfectScore,
      submittedCount,
    };
  }

  if (maxAttempts != null) {
    if (submittedCount >= maxAttempts || hasPerfectScore) {
      return {
        canView: true,
        reason: 'eligible',
        attemptsUsed: submittedCount,
        maxAttempts,
        attemptsRemaining,
        hasPerfectScore,
        submittedCount,
      };
    }
    return {
      canView: false,
      reason: 'not_all_attempts_used',
      attemptsUsed: submittedCount,
      maxAttempts,
      attemptsRemaining,
      hasPerfectScore,
      submittedCount,
    };
  }

  return {
    canView: submittedCount > 0,
    reason: submittedCount > 0 ? 'eligible' : 'no_attempts',
    attemptsUsed: submittedCount,
    maxAttempts,
    attemptsRemaining,
    hasPerfectScore,
    submittedCount,
  };
}

export function getCannotViewResultMessage(
  reason: CanViewResultReason,
  data: CanViewResultData,
): string {
  const attemptsRemaining = data.attemptsRemaining ?? 0;
  const hasLimit = data.maxAttempts !== null;

  if (!hasLimit) {
    if (reason === 'no_attempts') {
      return 'Bạn chưa làm bài nào. Hãy bắt đầu làm bài để xem kết quả chi tiết nha!';
    }
    return '';
  }

  if (attemptsRemaining > 0) {
    return `Để xem kết quả chi tiết, bạn phải đạt điểm tuyệt đối hoặc đã cố gắng hết sức. Bạn vẫn còn ${attemptsRemaining} lần thử nữa để đạt điểm cao hơn, hãy cố gắng lên và thử lại nha!`;
  }
  return 'Bạn đã sử dụng hết các lần thử. Hãy cố gắng hơn ở những bài tiếp theo nhé!';
}

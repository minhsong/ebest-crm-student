/** Eligibility xem chi tiết đáp án — SSOT cho assignment & practice. */
export type QuizResultEligibility = {
  submittedCount: number;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
  hasPerfectScore: boolean;
};

/** @deprecated Dùng QuizResultEligibility */
export type QuizEligibilityFromCrm = QuizResultEligibility;

export type QuizAttemptEligibilityStats = Pick<
  QuizResultEligibility,
  'submittedCount' | 'hasPerfectScore' | 'maxAttempts' | 'attemptsRemaining'
>;

export type CanViewResultReason =
  | 'eligible'
  | 'no_attempts'
  | 'not_all_attempts_used'
  | 'no_perfect_score';

export type CanViewResultData = QuizResultEligibility & {
  canView: boolean;
  reason: CanViewResultReason;
  /** Alias submittedCount — dùng trên UI cũ */
  attemptsUsed: number;
};

export type CanViewResultInput = {
  eligibility?: QuizResultEligibility | null;
};

export const QUIZ_RESULT_DETAIL_LOCKED_DESCRIPTION =
  'Xem chi tiết đáp án khi hết lượt làm bài hoặc đạt 100% câu đúng.';

export const QUIZ_RESULT_DETAIL_LOCKED_TITLE =
  'Chưa đủ điều kiện xem chi tiết đáp án (hết lượt hoặc đạt 100%)';

/**
 * Ưu tiên max bài tập (assignment); ôn luyện chỉ dùng max từ đề / authorize.
 */
export function resolveQuizMaxAttempts(
  assignmentMax?: number | null,
  formMax?: number | null,
): number | null {
  if (assignmentMax !== undefined && assignmentMax !== null) {
    return assignmentMax;
  }
  if (formMax !== undefined) {
    return formMax ?? null;
  }
  return null;
}

export function computeAttemptsRemaining(
  maxAttempts: number | null,
  submittedCount: number,
): number | null {
  if (maxAttempts == null) return null;
  return Math.max(0, maxAttempts - submittedCount);
}

export function buildQuizResultEligibility(input: {
  submittedCount: number;
  hasPerfectScore: boolean;
  maxAttempts: number | null;
  attemptsRemaining?: number | null;
}): QuizResultEligibility {
  return {
    submittedCount: input.submittedCount,
    hasPerfectScore: input.hasPerfectScore,
    maxAttempts: input.maxAttempts,
    attemptsRemaining:
      input.attemptsRemaining ??
      computeAttemptsRemaining(input.maxAttempts, input.submittedCount),
  };
}

export function buildQuizEligibilityFromGatewayStats(
  stats: QuizAttemptEligibilityStats | null,
  options: {
    channel: 'assignment' | 'practice';
    maxAttemptsHint?: number | null;
  },
): QuizResultEligibility | null {
  if (!stats) return null;

  const maxAttempts =
    options.channel === 'assignment'
      ? resolveQuizMaxAttempts(options.maxAttemptsHint, stats.maxAttempts)
      : resolveQuizMaxAttempts(
          undefined,
          options.maxAttemptsHint ?? stats.maxAttempts,
        );

  return buildQuizResultEligibility({
    submittedCount: stats.submittedCount,
    hasPerfectScore: stats.hasPerfectScore,
    maxAttempts,
    attemptsRemaining: stats.attemptsRemaining,
  });
}

/**
 * Được xem chi tiết đáp án khi đã nộp ≥ 1 lần và (hết lượt hoặc đạt 100% / đủ câu đúng).
 */
export function isQuizResultDetailEligible(
  eligibility: Pick<
    QuizResultEligibility,
    'submittedCount' | 'maxAttempts' | 'hasPerfectScore'
  > | null,
): boolean {
  if (!eligibility || eligibility.submittedCount <= 0) {
    return false;
  }
  if (eligibility.hasPerfectScore) {
    return true;
  }
  const max = eligibility.maxAttempts;
  return max != null && eligibility.submittedCount >= max;
}

export function computeCanViewResultDetails(
  input: CanViewResultInput,
): CanViewResultData {
  const eligibility = input.eligibility;
  const submittedCount = eligibility?.submittedCount ?? 0;
  const maxAttempts = eligibility?.maxAttempts ?? null;
  const attemptsRemaining =
    eligibility?.attemptsRemaining ??
    computeAttemptsRemaining(maxAttempts, submittedCount);
  const hasPerfectScore = Boolean(eligibility?.hasPerfectScore);

  const base = {
    submittedCount,
    maxAttempts,
    attemptsRemaining,
    hasPerfectScore,
    attemptsUsed: submittedCount,
  };

  if (submittedCount === 0) {
    return { ...base, canView: false, reason: 'no_attempts' };
  }

  const normalized = buildQuizResultEligibility({
    submittedCount,
    hasPerfectScore,
    maxAttempts,
    attemptsRemaining,
  });

  if (isQuizResultDetailEligible(normalized)) {
    return { ...base, canView: true, reason: 'eligible' };
  }

  const reason: CanViewResultReason =
    maxAttempts != null ? 'not_all_attempts_used' : 'no_perfect_score';

  return { ...base, canView: false, reason };
}

export function getCannotViewResultMessage(
  reason: CanViewResultReason,
  data: CanViewResultData,
): string {
  const attemptsRemaining = data.attemptsRemaining ?? 0;
  const hasLimit = data.maxAttempts !== null;

  if (reason === 'no_attempts') {
    return 'Bạn chưa làm bài nào. Hãy bắt đầu làm bài để xem kết quả chi tiết nha!';
  }

  if (reason === 'no_perfect_score') {
    return 'Để xem kết quả chi tiết, bạn cần đạt điểm tuyệt đối (100% câu đúng). Hãy làm lại và cố gắng nhé!';
  }

  if (!hasLimit) {
    return '';
  }

  if (attemptsRemaining > 0) {
    return `Để xem kết quả chi tiết, bạn phải đạt điểm tuyệt đối hoặc đã cố gắng hết sức. Bạn vẫn còn ${attemptsRemaining} lần thử nữa để đạt điểm cao hơn, hãy cố gắng lên và thử lại nha!`;
  }
  return 'Bạn đã sử dụng hết các lần thử. Hãy cố gắng hơn ở những bài tiếp theo nhé!';
}

'use client';

import { fetchQuizRuntimeJson, quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import { useEffect, useState } from 'react';

/** Eligibility data từ CRM API */
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
  /** Số lần đã làm */
  attemptsUsed: number;
  /** Số lần tối đa (null = không giới hạn) */
  maxAttempts: number | null;
  /** Số lần còn lại */
  attemptsRemaining: number | null;
  /** Có lần nào đạt 100% không */
  hasPerfectScore: boolean;
  /** Tổng số lần đã nộp (submitted) */
  submittedCount: number;
};

/**
 * Hook kiểm tra xem có thể hiển thị chi tiết kết quả bài làm hay không.
 *
 * Điều kiện hiển thị:
 * - Đã làm hết tất cả các lần thử (attemptsUsed >= maxAttempts), HOẶC
 * - Có ít nhất 1 lần đạt 100% điểm
 *
 * @param formPublicId - Public ID của form
 * @param currentAttemptId - ID của attempt hiện tại đang xem (để exclude khỏi count)
 * @param assignmentId - ID của assignment để kiểm tra eligibility chính xác
 */
export function useCanViewResultDetails(
  formPublicId: string,
  currentAttemptId?: string,
  assignmentId?: number,
) {
  const [data, setData] = useState<CanViewResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch eligibility info từ CRM (lấy maxAttempts từ assignment)
        let eligibility: QuizEligibilityFromCrm | null = null;
        try {
          // Build URL với query param assignmentId nếu có
          const eligUrl = assignmentId
            ? `/api/assignments/quiz-eligibility/${encodeURIComponent(formPublicId)}?assignmentId=${assignmentId}`
            : `/api/assignments/quiz-eligibility/${encodeURIComponent(formPublicId)}`;
          const eligRes = await fetch(eligUrl, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          if (eligRes.ok) {
            eligibility = await eligRes.json();
          } else if (eligRes.status === 404) {
            // Không tìm thấy assignment - fallback: cho phép xem nếu không có giới hạn
            // Hoặc tính toán dựa trên attempt history
          }
        } catch {
          // CRM eligibility fetch failed, continue with defaults
        }

        // Fetch attempt history từ quiz runtime
        const historyRes = await fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
          quizRuntimePublicUrl(`forms/${formPublicId}/attempts`),
        );

        if (!historyRes.ok) {
          throw new Error('Không tải được lịch sử bài làm.');
        }

        const allAttempts = historyRes.data?.items ?? [];

        // Filter submitted attempts (exclude in-progress)
        const submittedAttempts = allAttempts.filter(
          (a) => a.status === 'submitted' || a.status === 'expired',
        );

        // Exclude current attempt from count (if viewing a specific attempt)
        const relevantAttempts = currentAttemptId
          ? submittedAttempts.filter((a) => a.attemptPublicId !== currentAttemptId)
          : submittedAttempts;

        const attemptsUsed = relevantAttempts.length;

        // Check for perfect score (100%) từ attempt history
        const hasPerfectScore = submittedAttempts.some(
          (a) =>
            a.gradingSummary &&
            a.gradingSummary.accuracy >= 1, // 1 = 100%
        ) || (eligibility?.hasPerfectScore ?? false);

        // Use maxAttempts từ CRM eligibility (hoặc null nếu không có)
        const maxAttempts = eligibility?.maxAttempts ?? null;
        const attemptsRemaining = eligibility?.attemptsRemaining ?? (
          maxAttempts !== null ? Math.max(0, maxAttempts - attemptsUsed) : null
        );
        const submittedCount = eligibility?.submittedCount ?? submittedAttempts.length;

        // Determine if can view
        let canView = false;
        let reason: CanViewResultReason = 'eligible';

        if (submittedAttempts.length === 0) {
          canView = false;
          reason = 'no_attempts';
        } else if (maxAttempts !== null) {
          // Có giới hạn số lần
          if (attemptsUsed >= maxAttempts) {
            // Đã làm hết các lần
            canView = true;
            reason = 'eligible';
          } else if (hasPerfectScore) {
            // Đã có lần đạt 100%
            canView = true;
            reason = 'eligible';
          } else {
            // Chưa làm hết và chưa có 100%
            canView = false;
            reason = attemptsUsed > 0 ? 'not_all_attempts_used' : 'no_attempts';
          }
        } else {
          // Không giới hạn số lần (hoặc API không hoạt động)
          // Fallback: cho phép xem nếu đã làm ít nhất 1 lần và không có perfect score
          // Hoặc không có perfect score thì vẫn cho xem (để không block user khi API lỗi)
          if (eligibility === null && submittedAttempts.length > 0) {
            // API không hoạt động - cho phép xem kết quả để không block user
            canView = true;
            reason = 'eligible';
          } else {
            canView = hasPerfectScore;
            reason = hasPerfectScore ? 'eligible' : 'no_perfect_score';
          }
        }

        if (!cancelled) {
          setData({
            canView,
            reason,
            attemptsUsed,
            maxAttempts,
            attemptsRemaining,
            hasPerfectScore,
            submittedCount,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Lỗi kiểm tra quyền xem kết quả.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formPublicId, currentAttemptId, assignmentId]);

  return { data, loading, error };
}

/**
 * Lấy thông báo phù hợp với lý do không thể xem kết quả.
 * Thông báo có tính thông tin và động viên học sinh.
 */
export function getCannotViewResultMessage(reason: CanViewResultReason, data: CanViewResultData): string {
  const attemptsRemaining = data.attemptsRemaining ?? 0;
  const hasLimit = data.maxAttempts !== null;

  // Khi không có giới hạn (hoặc API không hoạt động)
  if (!hasLimit) {
    if (reason === 'no_attempts') {
      return 'Bạn chưa làm bài nào. Hãy bắt đầu làm bài để xem kết quả chi tiết nha!';
    }
    if (!data.hasPerfectScore) {
      return 'Bạn chưa đạt điểm tuyệt đối. Hãy cố gắng hết sức để đạt 100% và xem kết quả chi tiết nhé!';
    }
    return '';
  }

  // Có giới hạn số lần
  if (attemptsRemaining > 0) {
    return `Để xem kết quả chi tiết, bạn phải đạt điểm tuyệt đối hoặc đã cố gắng hết sức. Bạn vẫn còn ${attemptsRemaining} lần thử nữa để đạt điểm cao hơn, hãy cố gắng lên và thử lại nha!`;
  }
  return 'Bạn đã sử dụng hết các lần thử. Hãy cố gắng hơn ở những bài tiếp theo nhé!';
}

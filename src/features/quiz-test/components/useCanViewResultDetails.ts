'use client';

import { fetchQuizRuntimeJson, quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import { useEffect, useState } from 'react';

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
 * @param assignmentId - ID của bài tập (để lấy maxAttempts)
 * @param currentAttemptId - ID của attempt hiện tại đang xem (để exclude khỏi count)
 */
export function useCanViewResultDetails(
  formPublicId: string,
  assignmentId?: number,
  currentAttemptId?: string,
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
        // Fetch attempt history
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

        // Check for perfect score (100%)
        const hasPerfectScore = submittedAttempts.some(
          (a) =>
            a.gradingSummary &&
            a.gradingSummary.accuracy >= 1, // 1 = 100%
        );

        // Determine max attempts
        // If assignmentId provided, we'd need to fetch from CRM
        // For now, we'll use the blueprint from form or default to null (unlimited)
        let maxAttempts: number | null = null;
        let attemptsRemaining: number | null = null;

        // If we have a limit, calculate remaining
        if (maxAttempts !== null) {
          attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);
        }

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
          // Không giới hạn số lần - chỉ cần có perfect score
          canView = hasPerfectScore;
          reason = hasPerfectScore ? 'eligible' : 'no_perfect_score';
        }

        if (!cancelled) {
          setData({
            canView,
            reason,
            attemptsUsed,
            maxAttempts,
            attemptsRemaining,
            hasPerfectScore,
            submittedCount: submittedAttempts.length,
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
  }, [formPublicId, assignmentId, currentAttemptId]);

  return { data, loading, error };
}

/**
 * Lấy thông báo phù hợp với lý do không thể xem kết quả.
 */
export function getCannotViewResultMessage(reason: CanViewResultReason, data: CanViewResultData): string {
  switch (reason) {
    case 'no_attempts':
      return 'Bạn chưa làm bài nào.';

    case 'not_all_attempts_used':
      if (data.maxAttempts !== null && data.maxAttempts > 0) {
        const remaining = data.maxAttempts - data.attemptsUsed;
        return `Bạn đã làm ${data.attemptsUsed}/${data.maxAttempts} lần. Còn ${remaining} lần làm bài. Hoàn thành tất cả các lần hoặc đạt 100% điểm để xem chi tiết kết quả.`;
      }
      return 'Bạn chưa đạt điểm tối đa. Làm bài để đạt 100% điểm và xem chi tiết kết quả.';

    case 'no_perfect_score':
      return 'Bạn chưa có lần nào đạt 100% điểm. Hoàn thành bài thi với điểm tối đa để xem chi tiết kết quả.';

    case 'eligible':
    default:
      return '';
  }
}

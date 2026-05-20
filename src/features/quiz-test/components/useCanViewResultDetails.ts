'use client';

import {
  filterSubmittedAttemptsForAssignment,
  normalizeQuizAttemptHistoryItems,
} from '@/features/quiz-test/lib/quiz-attempt-history';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import {
  computeCanViewResultDetails,
  type CanViewResultData,
  type CanViewResultReason,
  type QuizEligibilityFromCrm,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import {
  quizRuntimeQueryFromAccess,
  resolveQuizRuntimeAccess,
} from '@/lib/quiz-runtime-access';
import { useEffect, useState } from 'react';

export type { CanViewResultData, CanViewResultReason, QuizEligibilityFromCrm };

export { getCannotViewResultMessage } from '@/features/quiz-test/lib/quiz-result-view-policy';

/**
 * Kiểm tra quyền xem chi tiết (dùng khi chưa có bundle attempt).
 * Trang kết quả nên dùng `useQuizAttemptResultPage` — một request gom.
 */
export function useCanViewResultDetails(
  formPublicId: string,
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
        const access = await resolveQuizRuntimeAccess(formPublicId, {
          attemptPublicId: currentAttemptId,
          intent: 'access',
        });
        if (!access) {
          throw new Error('Không xác định được quyền truy cập đề.');
        }

        const assignmentId =
          access.mode === 'assignment' ? access.assignmentId : undefined;
        const historySuffix = quizRuntimeQueryFromAccess(access);

        let eligibility: QuizEligibilityFromCrm | null = null;
        if (assignmentId != null) {
          const eligRes = await fetch(
            `/api/assignments/quiz-eligibility/${encodeURIComponent(formPublicId)}?assignmentId=${assignmentId}`,
            {
              credentials: 'include',
              headers: { Accept: 'application/json' },
              cache: 'no-store',
            },
          );
          if (eligRes.ok) {
            eligibility = await eligRes.json();
          }
        }

        const historyRes = await fetchQuizRuntimeJson<{ items?: unknown[] }>(
          `${quizRuntimePublicUrl(`forms/${formPublicId}/attempts`)}${historySuffix}`,
        );
        if (!historyRes.ok) {
          throw new Error('Không tải được lịch sử bài làm.');
        }

        const allAttempts = normalizeQuizAttemptHistoryItems(historyRes.data?.items);
        let submittedAttempts = allAttempts.filter(
          (a) => a.status === 'submitted' || a.status === 'expired',
        );
        if (assignmentId != null && assignmentId >= 1) {
          submittedAttempts = filterSubmittedAttemptsForAssignment(
            allAttempts,
            assignmentId,
          );
        }

        const next = computeCanViewResultDetails({
          accessMode: access.mode,
          attemptStatus: 'submitted',
          hasGradingItems: false,
          eligibility,
          submittedAttemptsCount: submittedAttempts.length,
        });

        if (!cancelled) setData(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Lỗi kiểm tra quyền xem kết quả.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formPublicId, currentAttemptId]);

  return { data, loading, error };
}

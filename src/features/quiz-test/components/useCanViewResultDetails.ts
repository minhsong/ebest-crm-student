'use client';

import {
  computeCanViewResultDetails,
  type CanViewResultData,
  type CanViewResultReason,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { fetchQuizEligibilityForAccess } from '@/lib/quiz-runtime-eligibility';
import { resolveQuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { useEffect, useState } from 'react';

export type { CanViewResultData, CanViewResultReason };
export type { QuizResultEligibility as QuizEligibilityFromCrm };

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

        const eligibility = await fetchQuizEligibilityForAccess(formPublicId, access);
        const next = computeCanViewResultDetails({ eligibility });

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

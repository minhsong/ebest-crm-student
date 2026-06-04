'use client';

import { useEffect, useState } from 'react';
import { loadPracticeQuizActionState } from '@/lib/quiz-assignment-action';
import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action';
import { getQuizFormContext } from '@/lib/quiz-form-context';
import { resolveQuizRuntimeAccess } from '@/lib/quiz-runtime-access';

type AssignmentActionSlice = Pick<
  AssignmentQuizActionState,
  'loading' | 'canViewResultDetail' | 'canViewResults'
>;

/**
 * Cổng UI: được phép mở trang chi tiết đáp án (D41 — hết lượt hoặc 100%).
 */
export function useQuizResultViewGate(
  formPublicId: string,
  options: {
    assignmentId?: number;
    practiceMode?: boolean;
    assignmentAction?: AssignmentActionSlice;
  },
): { allowDetailLinks: boolean; loading: boolean } {
  const { assignmentId, practiceMode, assignmentAction } = options;
  const [practiceCanView, setPracticeCanView] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(Boolean(practiceMode));

  useEffect(() => {
    if (!practiceMode) {
      setPracticeCanView(false);
      setPracticeLoading(false);
      return;
    }

    let cancelled = false;
    setPracticeLoading(true);

    void (async () => {
      const access = await resolveQuizRuntimeAccess(formPublicId, {
        intent: 'access',
        preferPractice: true,
      });
      const stored = getQuizFormContext(formPublicId);
      const maxHint =
        access?.effectiveMaxAttempts ?? stored?.quizMaxAttempts ?? undefined;
      const state = await loadPracticeQuizActionState(formPublicId, maxHint);
      if (!cancelled) {
        setPracticeCanView(state.canViewResultDetail);
        setPracticeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formPublicId, practiceMode]);

  if (assignmentId != null && assignmentId >= 1) {
    const loading = assignmentAction?.loading ?? true;
    const canView =
      !loading &&
      (assignmentAction?.canViewResultDetail ?? assignmentAction?.canViewResults ?? false);
    return { allowDetailLinks: canView, loading };
  }

  if (practiceMode) {
    return { allowDetailLinks: practiceCanView, loading: practiceLoading };
  }

  return { allowDetailLinks: false, loading: false };
}

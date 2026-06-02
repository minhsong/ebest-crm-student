'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import type { QuizResultEligibility } from '@/features/quiz-test/lib/quiz-result-view-policy';
import {
  assignmentActionStateFromSnapshot,
} from '@/lib/quiz-assignment-action.builders';
import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action.types';
import { fetchAssignmentQuizSnapshot } from '@/lib/quiz-assignment-action.loader';
import { fetchQuizFormDisplayName } from '@/lib/quiz-form-display';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { pinAssignmentQuizRuntimeAccess } from '@/lib/quiz-runtime-access';

type ResultsState = {
  formName: string;
  action: AssignmentQuizActionState | null;
};

const EMPTY_ACTION: AssignmentQuizActionState = {
  loading: true,
  error: null,
  canStart: false,
  startBlockReason: null,
  eligibility: null,
  submittedAttempts: [],
  canViewResultDetail: false,
  canViewResults: false,
  resultsPageHref: '',
};

export type UseQuizAssignmentResultsResult = ResultsState & {
  loading: boolean;
  error: string | null;
  eligibility: QuizResultEligibility | null;
  attempts: QuizAttemptHistoryItem[];
  canStart: boolean;
  startBlockReason: string | null;
  canViewDetail: boolean;
  attemptsRemaining: number | null;
  reload: () => Promise<void>;
  refreshHistory: () => Promise<QuizAttemptHistoryItem[]>;
};

export function useQuizAssignmentResults(
  formPublicId: string,
  assignmentId: number,
  access: QuizRuntimeAccess,
): UseQuizAssignmentResultsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ResultsState>({
    formName: '',
    action: null,
  });

  const maxAttemptsHint = access.effectiveMaxAttempts;

  const loadSnapshot = useCallback(async () => {
    pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId, {
      quizMaxAttempts: maxAttemptsHint,
    });

    const [formName, snapshot] = await Promise.all([
      fetchQuizFormDisplayName(formPublicId),
      fetchAssignmentQuizSnapshot({
        formPublicId,
        assignmentId,
        maxAttemptsHint,
      }),
    ]);

    const action = assignmentActionStateFromSnapshot(formPublicId, snapshot);
    return { formName, action };
  }, [assignmentId, formPublicId, maxAttemptsHint]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadSnapshot();
      setState(next);

      if (
        next.action.submittedAttempts.length === 0 &&
        !next.action.canStart
      ) {
        setError(next.action.startBlockReason ?? 'Chưa có lần làm bài để xem.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
      setState({ formName: '', action: null });
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot]);

  const refreshHistory = useCallback(async () => {
    const snapshot = await fetchAssignmentQuizSnapshot({
      formPublicId,
      assignmentId,
      maxAttemptsHint,
    });
    const action = assignmentActionStateFromSnapshot(formPublicId, snapshot);
    setState((prev) => ({
      ...prev,
      action,
    }));
    return snapshot.submittedAttempts;
  }, [assignmentId, formPublicId, maxAttemptsHint]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const action = state.action ?? EMPTY_ACTION;
  const eligibility = action.eligibility;

  return {
    formName: state.formName,
    action: state.action,
    loading,
    error,
    eligibility,
    attempts: action.submittedAttempts,
    canStart: action.canStart,
    startBlockReason: action.startBlockReason,
    canViewDetail: action.canViewResultDetail,
    attemptsRemaining: eligibility?.attemptsRemaining ?? null,
    reload,
    refreshHistory,
  };
}

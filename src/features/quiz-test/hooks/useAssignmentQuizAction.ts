'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  loadAssignmentQuizActionState,
  type AssignmentQuizActionState,
} from '@/lib/quiz-assignment-action';

const EMPTY: AssignmentQuizActionState = {
  loading: true,
  error: null,
  canStart: false,
  startBlockReason: null,
  eligibility: null,
  submittedAttempts: [],
  canViewResults: false,
  resultsPageHref: '',
};

export function useAssignmentQuizAction(
  formPublicId: string | null | undefined,
  assignmentId: number | null | undefined,
) {
  const [state, setState] = useState<AssignmentQuizActionState>(EMPTY);

  const reload = useCallback(async () => {
    const fid = (formPublicId ?? '').trim();
    const aid = assignmentId;
    if (!fid || aid == null || !Number.isFinite(aid) || aid < 1) {
      setState({ ...EMPTY, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const next = await loadAssignmentQuizActionState(fid, aid);
    setState(next);
  }, [formPublicId, assignmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}

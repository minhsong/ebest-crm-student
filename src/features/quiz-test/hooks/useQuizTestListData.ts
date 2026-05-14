'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  buildQuizAssignmentListFromOverview,
  collectFormPublicIdsForProgress,
} from '@/features/quiz-test/lib/quiz-assignment-overview';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { toQuizProgressMap } from '@/features/quiz-test/lib/quiz-runtime-response-mappers';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptProgressItem, QuizAssignmentListItem } from '@/features/quiz-test/types';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

export function useQuizTestListData() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentItems, setAssignmentItems] = useState<QuizAssignmentListItem[]>([]);
  const [missingLinkedQuizCount, setMissingLinkedQuizCount] = useState(0);
  const [progressByForm, setProgressByForm] = useState<
    Record<string, QuizAttemptProgressItem>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overviewRes = await fetchWithAuth(OVERVIEW_SESSIONS_PATH);
      const overviewData = (await overviewRes.json().catch(() => [])) as unknown;
      const overviewBlocks = Array.isArray(overviewData)
        ? (overviewData as OverviewClassSessions[])
        : [];

      const { items: nextAssignmentItems, missingLinkedQuizCount: missing } =
        buildQuizAssignmentListFromOverview(overviewBlocks);
      setAssignmentItems(nextAssignmentItems);
      setMissingLinkedQuizCount(missing);

      const ids = collectFormPublicIdsForProgress(nextAssignmentItems);
      if (ids.length > 0) {
        const q = new URLSearchParams({ formPublicIds: ids.join(',') });
        const progressUrl = `${quizRuntimePublicUrl('progress')}?${q.toString()}`;
        const pr = await fetchQuizRuntimeJson<{ items?: unknown[] }>(progressUrl);
        setProgressByForm(pr.ok ? toQuizProgressMap(pr.data.items) : {});
      } else {
        setProgressByForm({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách đề.');
      setAssignmentItems([]);
      setMissingLinkedQuizCount(0);
      setProgressByForm({});
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refetchIfVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', refetchIfVisible);
    document.addEventListener('visibilitychange', refetchIfVisible);
    return () => {
      window.removeEventListener('focus', refetchIfVisible);
      document.removeEventListener('visibilitychange', refetchIfVisible);
    };
  }, [load]);

  return {
    loading,
    error,
    assignmentItems,
    missingLinkedQuizCount,
    progressByForm,
    load,
  };
}

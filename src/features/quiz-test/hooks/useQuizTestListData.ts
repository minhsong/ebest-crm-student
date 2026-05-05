'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  collectFormPublicIdsForProgress,
  extractQuizCandidatesFromOverview,
  mapStudentAssignmentDetailToQuizRow,
  sortQuizAssignmentListItems,
} from '@/features/quiz-test/lib/quiz-assignment-overview';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  toQuizProgressMap,
  toQuizPublishedFormSummaries,
} from '@/features/quiz-test/lib/quiz-runtime-response-mappers';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type {
  QuizAttemptProgressItem,
  QuizAssignmentListItem,
  QuizPublishedFormSummary,
} from '@/features/quiz-test/types';
import { normalizeStudentAssignmentDetail } from '@/lib/student-assignment-detail-normalize';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

export function useQuizTestListData() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicItems, setPublicItems] = useState<QuizPublishedFormSummary[]>([]);
  const [assignmentItems, setAssignmentItems] = useState<QuizAssignmentListItem[]>([]);
  const [missingLinkedQuizCount, setMissingLinkedQuizCount] = useState(0);
  const [progressByForm, setProgressByForm] = useState<
    Record<string, QuizAttemptProgressItem>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const publicListUrl = quizRuntimePublicUrl('forms');
      const { ok: listOk, status: listStatus, data: listData } = await fetchQuizRuntimeJson<{
        items?: unknown[];
        message?: string;
      }>(publicListUrl);
      if (!listOk) {
        const msg =
          typeof listData === 'object' && listData && 'message' in listData
            ? String((listData as { message?: unknown }).message ?? `HTTP ${listStatus}`)
            : `HTTP ${listStatus}`;
        throw new Error(msg);
      }
      const nextPublicItems = toQuizPublishedFormSummaries(listData.items);
      setPublicItems(nextPublicItems);

      const overviewRes = await fetchWithAuth(OVERVIEW_SESSIONS_PATH);
      const overviewData = (await overviewRes.json().catch(() => [])) as unknown;
      const overviewBlocks = Array.isArray(overviewData)
        ? (overviewData as OverviewClassSessions[])
        : [];

      const candidates = extractQuizCandidatesFromOverview(overviewBlocks);

      const detailRows = await Promise.all(
        candidates.map(async (candidate) => {
          const res = await fetchWithAuth(`/api/assignments/${candidate.assignmentId}`);
          const data = await res.json().catch(() => null);
          if (!res.ok) return null;
          const detail = normalizeStudentAssignmentDetail(data);
          if (!detail) return null;
          return mapStudentAssignmentDetailToQuizRow(detail, candidate);
        }),
      );

      const linkedItems: QuizAssignmentListItem[] = [];
      let missingCount = 0;
      for (const row of detailRows) {
        if (!row) continue;
        if (row.kind === 'missing_link') {
          missingCount += 1;
          continue;
        }
        if (row.kind === 'linked') linkedItems.push(row.item);
      }

      const nextAssignmentItems = sortQuizAssignmentListItems(linkedItems);
      setAssignmentItems(nextAssignmentItems);
      setMissingLinkedQuizCount(missingCount);

      const ids = collectFormPublicIdsForProgress(nextPublicItems, nextAssignmentItems);
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
      setPublicItems([]);
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
    publicItems,
    assignmentItems,
    missingLinkedQuizCount,
    progressByForm,
    load,
  };
}

import { useCallback, useEffect, useState } from 'react';
import type { StudentChecklistListRow } from '@/types/student-checklists';

export type ChecklistStatusFilter = 'all' | 'pending' | 'done';

export function useClassChecklists(params: {
  classId: number;
  status: ChecklistStatusFilter;
  enabled: boolean;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const { classId, status, enabled, fetchWithAuth } = params;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<StudentChecklistListRow[]>([]);

  const load = useCallback(async () => {
    if (!enabled) return;
    if (!Number.isFinite(classId) || classId < 1) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/classes/${classId}/checklists?status=${status}`,
      );
      const data = await res.json().catch(() => []);
      setRows(res.ok && Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchWithAuth, classId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, rows, reload: load };
}


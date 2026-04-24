import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OverviewClassSessions } from '@/types/overview-sessions';

export function useClassOverview(params: {
  classId: number;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const { classId, fetchWithAuth } = params;
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewClassSessions | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(classId) || classId < 1) {
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/overview/sessions');
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? (data as OverviewClassSessions[]) : [];
      const found = list.find((c) => c.classId === classId) ?? null;
      setOverview(found);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sessions = useMemo(() => overview?.sessions ?? [], [overview]);

  return {
    loading,
    overview,
    sessions,
    reload: load,
  };
}


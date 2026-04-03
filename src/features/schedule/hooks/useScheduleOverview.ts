'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { OverviewClassSessions } from '@/types/overview-sessions';
import {
  includeSessionInStudentSchedule,
  orderSessionsPlannedFirst,
} from '@/lib/session-schedule';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

/**
 * Lịch buổi học — API scope theo JWT; route Next chỉ forward Authorization.
 * Chỉ hiển thị buổi không hủy; thứ tự: buổi sắp/planned (chưa kết thúc) trước, buổi đã qua sau.
 */
export function useScheduleOverview() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<OverviewClassSessions[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(OVERVIEW_SESSIONS_PATH);
      const data = await res.json().catch(() => []);
      setBlocks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduleBlocks = useMemo(() => {
    return blocks
      .map((block) => {
        const sessions = (block.sessions ?? [])
          .filter(includeSessionInStudentSchedule)
          .slice();
        return {
          ...block,
          sessions: orderSessionsPlannedFirst(sessions),
        };
      })
      .filter((b) => b.sessions.length > 0);
  }, [blocks]);

  const sessionCount = useMemo(
    () =>
      scheduleBlocks.reduce((n, b) => n + (b.sessions?.length ?? 0), 0),
    [scheduleBlocks],
  );

  return {
    loading,
    blocks,
    load,
    scheduleBlocks,
    sessionCount,
  };
}

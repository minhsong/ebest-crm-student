'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchWeekDrillScore } from '@/lib/learning-api';
import type { LearningHubWeekStats } from '@/types/learning';

/** Hub week stats + fallback BFF `stats/week-score` khi CRM hub chưa merge drill. */
export function useGamesHubWeekStats(
  weekStats: LearningHubWeekStats | null | undefined,
): LearningHubWeekStats | null {
  const [drillFallback, setDrillFallback] = useState<{
    score: number;
    playCount: number;
  } | null>(null);

  const needsDrillFallback =
    weekStats != null &&
    (weekStats.weekDrillScore == null || weekStats.weekDrillPlays == null);

  useEffect(() => {
    if (!needsDrillFallback) {
      setDrillFallback(null);
      return;
    }
    let cancelled = false;
    void fetchWeekDrillScore()
      .then((data) => {
        if (!cancelled) setDrillFallback(data);
      })
      .catch(() => {
        if (!cancelled) setDrillFallback(null);
      });
    return () => {
      cancelled = true;
    };
  }, [needsDrillFallback]);

  return useMemo(() => {
    if (!weekStats) return null;
    if (!drillFallback) return weekStats;
    return {
      ...weekStats,
      weekDrillScore: weekStats.weekDrillScore ?? drillFallback.score,
      weekDrillPlays: weekStats.weekDrillPlays ?? drillFallback.playCount,
    };
  }, [drillFallback, weekStats]);
}

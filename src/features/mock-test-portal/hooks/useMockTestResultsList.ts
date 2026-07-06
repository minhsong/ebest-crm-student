'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LeadTestResultSummary } from '@/lib/lead-portal/types';

type Options = {
  enabled?: boolean;
  fetcher: () => Promise<LeadTestResultSummary[]>;
  loadErrorFallback?: string;
};

/**
 * Hook fetch danh sách kết quả thi thử — tái s dụng lead + student hub.
 */
export function useMockTestResultsList({
  enabled = true,
  fetcher,
  loadErrorFallback = 'Không tải được kết quả thi thử.',
}: Options) {
  const [items, setItems] = useState<LeadTestResultSummary[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : loadErrorFallback);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, loadErrorFallback]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, reload]);

  return { items, loading, error, reload };
}

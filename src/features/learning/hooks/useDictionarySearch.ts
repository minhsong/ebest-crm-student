'use client';

import { useEffect, useState } from 'react';
import { fetchDictionarySearch } from '@/lib/learning-api';
import type { DictionarySearchItem } from '@/types/learning';

export type DictionarySearchPagination = {
  total: number;
  current: number;
  pageSize: number;
  totalPages: number;
};

export function useDictionarySearch(query: string, page: number) {
  const [items, setItems] = useState<DictionarySearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DictionarySearchPagination>({
    total: 0,
    current: 1,
    pageSize: 20,
    totalPages: 0,
  });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      setError(null);
      setPagination({ total: 0, current: 1, pageSize: 20, totalPages: 0 });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchDictionarySearch(q, page > 0 ? page : 1)
      .then((payload) => {
        if (cancelled) return;
        setItems(payload.items);
        setPagination(payload.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        const status = (err as Error & { status?: number })?.status;
        if (status === 429) {
          setError('Bạn tra cứu quá nhanh. Vui lòng thử lại sau vài phút.');
        } else {
          setError(err instanceof Error ? err.message : 'Không tìm được từ.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, page]);

  return { items, loading, error, pagination };
}

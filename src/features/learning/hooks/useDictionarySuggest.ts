'use client';

import { useEffect, useState } from 'react';
import { fetchDictionarySuggest } from '@/lib/learning-api';
import type { DictionarySuggestItem } from '@/types/learning';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

export function useDictionarySuggest(query: string) {
  const [items, setItems] = useState<DictionarySuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LEN) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void fetchDictionarySuggest(trimmed)
        .then((payload) => {
          if (cancelled) return;
          setItems(payload.items);
        })
        .catch((err) => {
          if (cancelled) return;
          setItems([]);
          setError(err instanceof Error ? err.message : 'Không tải được gợi ý.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return { items, loading, error };
}

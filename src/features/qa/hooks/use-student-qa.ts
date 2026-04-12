'use client';

import { useAuth } from '@/contexts/auth-context';
import { useCallback, useEffect, useState } from 'react';

import {
  isQaDetail,
  isQaListResponse,
  type StudentPortalQaDetail,
  type StudentPortalQaListResponse,
} from '../lib/types';

export function useStudentQaList(params: { q?: string; tagId?: number }) {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentPortalQaListResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (params.q?.trim()) sp.set('q', params.q.trim());
      if (params.tagId != null) sp.set('tagId', String(params.tagId));
      const qs = sp.toString();
      const res = await fetchWithAuth(`/api/qa${qs ? `?${qs}` : ''}`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && isQaListResponse(json)) {
        setData(json);
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, params.q, params.tagId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, data, refresh: load };
}

export function useStudentQaBySlug(slug: string | undefined) {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(Boolean(slug));
  const [article, setArticle] = useState<StudentPortalQaDetail | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      setArticle(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/qa/by-slug/${encodeURIComponent(slug)}`,
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && isQaDetail(json)) {
        setArticle(json);
      } else {
        setArticle(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, article, refresh: load };
}

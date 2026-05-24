'use client';

import { useEffect, useState } from 'react';
import fallbackCatalog from '@/data/pronunciation-catalog.json';
import type { PronunciationReviewCatalog } from '@/components/media-review/types';

const FALLBACK = fallbackCatalog as PronunciationReviewCatalog;

export function usePronunciationCatalog(enabled = true) {
  const [catalog, setCatalog] = useState<PronunciationReviewCatalog>(FALLBACK);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const c = data?.pronunciation_review_catalog as
          | PronunciationReviewCatalog
          | undefined;
        if (c?.ipa?.length) setCatalog(c);
      })
      .catch(() => {
        if (!cancelled) setCatalog(FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { catalog };
}

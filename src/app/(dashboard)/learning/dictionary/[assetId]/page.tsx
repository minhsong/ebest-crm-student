'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Spin } from 'antd';
import {
  dictionaryLookupHref,
  parseDictionaryLookupSource,
} from '@/features/learning/utils/dictionary-routes';

function DictionaryWordRedirectInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const raw = params.assetId;
  const assetId = Number(Array.isArray(raw) ? raw[0] : raw);
  const source = parseDictionaryLookupSource(searchParams.get('source'));

  useEffect(() => {
    if (!Number.isFinite(assetId) || assetId <= 0) {
      router.replace('/learning/dictionary');
      return;
    }
    router.replace(dictionaryLookupHref({ id: assetId, source }));
  }, [assetId, router, source]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <Spin />
    </div>
  );
}

/** Deep link cũ → cùng trang search với `?id=` (giữ search bar, không tách page). */
export default function DictionaryWordRedirectPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spin />
        </div>
      }
    >
      <DictionaryWordRedirectInner />
    </Suspense>
  );
}

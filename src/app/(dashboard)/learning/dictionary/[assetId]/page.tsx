'use client';

import { useParams } from 'next/navigation';
import { DictionaryWordDetailView } from '@/features/learning/dictionary/DictionaryWordDetailView';

export default function DictionaryWordPage() {
  const params = useParams();
  const raw = params.assetId;
  const assetId = Number(Array.isArray(raw) ? raw[0] : raw);

  if (!Number.isFinite(assetId) || assetId <= 0) {
    return null;
  }

  return <DictionaryWordDetailView assetId={assetId} />;
}

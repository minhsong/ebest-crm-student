'use client';

import { Suspense } from 'react';
import { DictionaryLookupView } from '@/features/learning/dictionary/DictionaryLookupView';

export default function DictionaryPage() {
  return (
    <Suspense fallback={null}>
      <DictionaryLookupView />
    </Suspense>
  );
}

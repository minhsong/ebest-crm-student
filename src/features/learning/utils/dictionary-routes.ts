import type { DictionaryLookupSource } from '@/types/learning';

export function dictionaryHomeHref(): string {
  return '/learning/dictionary';
}

export function dictionarySearchHref(q: string): string {
  const params = new URLSearchParams({ q });
  return `/learning/dictionary?${params.toString()}`;
}

export function parseDictionaryLookupSource(
  value: string | null,
): DictionaryLookupSource {
  if (value === 'suggest' || value === 'search' || value === 'direct') {
    return value;
  }
  return 'direct';
}

export function dictionaryWordHref(
  assetId: number,
  source?: DictionaryLookupSource,
): string {
  if (!source || source === 'direct') {
    return `/learning/dictionary/${assetId}`;
  }
  const params = new URLSearchParams({ source });
  return `/learning/dictionary/${assetId}?${params.toString()}`;
}

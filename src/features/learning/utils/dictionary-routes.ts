import type { DictionaryLookupSource } from '@/types/learning';

export function dictionaryHomeHref(): string {
  return '/learning/dictionary';
}

export type DictionaryLookupQuery = {
  q?: string;
  page?: number;
  /** Asset đang xem chi tiết — cùng trang search, không đổi route. */
  id?: number;
  source?: DictionaryLookupSource;
};

export function dictionaryLookupHref(query: DictionaryLookupQuery = {}): string {
  const params = new URLSearchParams();
  const q = query.q?.trim();
  if (q) params.set('q', q);
  if (query.page != null && query.page > 1) {
    params.set('page', String(query.page));
  }
  if (query.id != null && Number.isFinite(query.id) && query.id > 0) {
    params.set('id', String(query.id));
  }
  if (query.source && query.source !== 'direct') {
    params.set('source', query.source);
  }
  const qs = params.toString();
  return qs ? `/learning/dictionary?${qs}` : '/learning/dictionary';
}

export function dictionarySearchHref(q: string, page = 1): string {
  return dictionaryLookupHref({ q, page });
}

export function parseDictionaryLookupSource(
  value: string | null,
): DictionaryLookupSource {
  if (value === 'suggest' || value === 'search' || value === 'direct') {
    return value;
  }
  return 'direct';
}

export function parseDictionaryAssetId(value: string | null): number | null {
  if (!value) return null;
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

/** Deep link / share — cùng trang lookup (`?id=`). Path cũ `/dictionary/[id]` redirect về đây. */
export function dictionaryWordHref(
  assetId: number,
  source?: DictionaryLookupSource,
  opts?: { q?: string; page?: number },
): string {
  return dictionaryLookupHref({
    id: assetId,
    source: source ?? 'direct',
    q: opts?.q,
    page: opts?.page,
  });
}

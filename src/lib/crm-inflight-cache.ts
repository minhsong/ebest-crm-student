/**
 * Dedupe CRM fetch song song (cùng key) — giảm burst /student/me và authorize khi reload quiz.
 */

export async function dedupeInflight<T>(
  map: Map<string, Promise<T>>,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = map.get(key);
  if (existing) return existing;

  const pending = fetcher().finally(() => {
    map.delete(key);
  });
  map.set(key, pending);
  return pending;
}

export type TtlCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function getTtlCacheHit<T>(
  map: Map<string, TtlCacheEntry<T>>,
  key: string,
): T | null {
  const hit = map.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

export function setTtlCache<T>(
  map: Map<string, TtlCacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
): void {
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const RATE_WINDOWS = new Map<
  string,
  Map<string, { count: number; resetAt: number }>
>();
const MAX_KEYS_PER_BUCKET = 10_000;

/**
 * In-memory rate limit đơn giản cho BFF portal (dev/single-instance).
 */
export function checkPortalBffRateLimit(
  bucket: string,
  ip: string,
  options?: { windowMs?: number; max?: number },
): boolean {
  const windowMs = options?.windowMs ?? 60_000;
  const max = options?.max ?? 60;
  const key = ip.trim() || 'unknown';
  const now = Date.now();

  let hits = RATE_WINDOWS.get(bucket);
  if (!hits) {
    hits = new Map();
    RATE_WINDOWS.set(bucket, hits);
  }

  const entry = hits.get(key);
  if (!entry && hits.size >= MAX_KEYS_PER_BUCKET) {
    for (const [candidateKey, candidate] of hits) {
      if (now >= candidate.resetAt) hits.delete(candidateKey);
    }
    if (hits.size >= MAX_KEYS_PER_BUCKET) return false;
  }
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

export function resolveBffClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

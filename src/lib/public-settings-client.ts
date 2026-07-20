/**
 * Client-side fetch + short dedupe for GET /api/settings/public.
 * Avoids parallel requests from login/profile/catalog mounting at once.
 * TTL ngắn: ops bật Google trên CRM cần thấy nút sau reload, không chờ 5 phút.
 */

export type PublicPortalSettings = Record<string, unknown>;

/** In-tab dedupe only — not a substitute for BFF freshness. */
const TTL_MS = 30 * 1000;

let cached: { data: PublicPortalSettings; at: number } | null = null;
let inflight: Promise<PublicPortalSettings> | null = null;

function unwrapPayload(data: unknown): PublicPortalSettings {
  if (!data || typeof data !== 'object') return {};
  const p = data as Record<string, unknown>;
  const raw = (p.result ?? p.data ?? p) as Record<string, unknown>;
  return raw && typeof raw === 'object' ? raw : {};
}

export async function fetchPublicPortalSettings(): Promise<PublicPortalSettings> {
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.data;
  }
  if (inflight) return inflight;

  inflight = fetch('/api/settings/public', { cache: 'no-store' })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof (data as { message?: string })?.message === 'string'
            ? (data as { message: string }).message
            : 'Không tải được cấu hình.',
        );
      }
      return unwrapPayload(data);
    })
    .then((payload) => {
      cached = { data: payload, at: Date.now() };
      return payload;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

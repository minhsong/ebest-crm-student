export const PORTAL_RETURN_URL_QUERY = 'returnUrl' as const;
const LEGACY_PORTAL_REDIRECT_QUERY = 'redirect' as const;

/**
 * Chỉ chấp nhận đường dẫn nội bộ tuyệt đối theo root.
 * Reject protocol-relative, backslash và ký tự điều khiển để tránh open redirect.
 */
export function sanitizePortalReturnUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const path = value.trim();
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return null;
  }
  return path;
}

type SearchParamsReader = {
  get(name: string): string | null;
};

/**
 * S0 — SSOT đọc deep-link sau auth.
 * `returnUrl` là canonical; `redirect` chỉ dual-read để tương thích link cũ.
 */
export function resolvePostAuthReturnUrl(
  searchParams: SearchParamsReader,
): string | null {
  return (
    sanitizePortalReturnUrl(searchParams.get(PORTAL_RETURN_URL_QUERY)) ??
    sanitizePortalReturnUrl(searchParams.get(LEGACY_PORTAL_REDIRECT_QUERY))
  );
}

export function buildPortalLoginHref(input: {
  returnUrl: string;
  mode?: 'lead' | 'student';
  sessionExpired?: boolean;
}): string {
  const query = new URLSearchParams();
  if (input.mode) query.set('mode', input.mode);
  if (input.sessionExpired) query.set('session', 'expired');
  const safeReturnUrl = sanitizePortalReturnUrl(input.returnUrl);
  if (safeReturnUrl) query.set(PORTAL_RETURN_URL_QUERY, safeReturnUrl);
  const suffix = query.toString();
  return suffix ? `/login?${suffix}` : '/login';
}

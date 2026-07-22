import { cookies } from 'next/headers';
import { resolvePortalAuthCookieMaxAgeSec } from '@/lib/portal-auth-cookie-max-age';

/** UPA-D11 — một cookie session portal. Không dual-read legacy. */
export const PORTAL_AUTH_COOKIE = 'portal_at';

/** Legacy names — chỉ clear (force logout); không đọc token. */
const LEGACY_PORTAL_COOKIES = [
  'student_portal_at',
  'lead_portal_at',
] as const;

function cookieBase() {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

/** Next.js: cookies().set chỉ hợp lệ trong Route Handler / Server Action. */
function isCookiesImmutableError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /Cookies can only be modified in a Server Action or Route Handler/i.test(
      error.message,
    )
  );
}

function clearNamedCookie(name: string): boolean {
  try {
    cookies().set(name, '', {
      ...cookieBase(),
      maxAge: 0,
    });
    return true;
  } catch (error) {
    if (isCookiesImmutableError(error)) return false;
    throw error;
  }
}

function readCookieValue(name: string): string {
  try {
    return cookies().get(name)?.value?.trim() ?? '';
  } catch {
    return '';
  }
}

/** Còn cookie dual cũ trên browser? */
export function hasLegacyPortalAuthCookies(): boolean {
  return LEGACY_PORTAL_COOKIES.some((name) => Boolean(readCookieValue(name)));
}

/**
 * Xóa cookie cũ còn sót (best-effort).
 * No-op khi gọi từ RSC (layout/page) — không throw.
 */
export function clearLegacyPortalAuthCookies(): void {
  for (const name of LEGACY_PORTAL_COOKIES) {
    clearNamedCookie(name);
  }
}

/**
 * Force logout cutover: xóa `portal_at` + mọi legacy.
 * Gọi từ Route Handler / Server Action khi token invalid / CRM 401.
 * RSC: no-op (không throw) — UI vẫn có thể seed guest.
 */
export function forcePortalLogoutCookies(): void {
  clearNamedCookie(PORTAL_AUTH_COOKIE);
  clearLegacyPortalAuthCookies();
}

/** Chỉ đọc `portal_at` (an toàn trong RSC). */
export function getPortalAccessTokenFromCookie(): string | null {
  const value = readCookieValue(PORTAL_AUTH_COOKIE);
  return value || null;
}

/**
 * Đọc token portal. Không mutate cookie (RSC-safe).
 * Sweep legacy chỉ qua `forcePortalLogoutCookies` / `setPortalAccessTokenCookie`
 * hoặc Route Handler session.
 */
export function readPortalAccessTokenOrSweepLegacy(): string | null {
  return getPortalAccessTokenFromCookie();
}

export function setPortalAccessTokenCookie(token: string): void {
  const v = token?.trim() ?? '';
  if (!v) return;
  try {
    cookies().set(PORTAL_AUTH_COOKIE, v, {
      ...cookieBase(),
      maxAge: resolvePortalAuthCookieMaxAgeSec(),
    });
  } catch (error) {
    if (isCookiesImmutableError(error)) {
      throw new Error(
        'setPortalAccessTokenCookie chỉ được gọi từ Route Handler hoặc Server Action.',
      );
    }
    throw error;
  }
  clearLegacyPortalAuthCookies();
}

export function clearPortalAccessTokenCookie(): void {
  forcePortalLogoutCookies();
}

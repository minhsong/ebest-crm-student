import { cookies } from 'next/headers';
import { resolvePortalAuthCookieMaxAgeSec } from '@/lib/portal-auth-cookie-max-age';

export const LEAD_PORTAL_AUTH_COOKIE = 'lead_portal_at';

export function getLeadAccessTokenFromCookie(): string | null {
  try {
    const jar = cookies();
    const v = jar.get(LEAD_PORTAL_AUTH_COOKIE)?.value ?? '';
    return v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setLeadAccessTokenCookie(token: string) {
  const v = token?.trim() ?? '';
  if (!v) return;
  cookies().set(LEAD_PORTAL_AUTH_COOKIE, v, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: resolvePortalAuthCookieMaxAgeSec(),
  });
}

export function clearLeadAccessTokenCookie() {
  cookies().set(LEAD_PORTAL_AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

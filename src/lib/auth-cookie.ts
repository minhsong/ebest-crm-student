import { cookies } from 'next/headers';
import { resolvePortalAuthCookieMaxAgeSec } from '@/lib/portal-auth-cookie-max-age';

export const STUDENT_PORTAL_AUTH_COOKIE = 'student_portal_at';

export function getStudentAccessTokenFromCookie(): string | null {
  try {
    const jar = cookies();
    const v = jar.get(STUDENT_PORTAL_AUTH_COOKIE)?.value ?? '';
    return v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setStudentAccessTokenCookie(token: string) {
  const v = token?.trim() ?? '';
  if (!v) return;
  cookies().set(STUDENT_PORTAL_AUTH_COOKIE, v, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    /** Thời gian sống cookie (browser). Khớp `AUTH_STUDENT_PORTAL_EXPIRES_IN` ở CRM. */
    maxAge: resolvePortalAuthCookieMaxAgeSec(),
  });
}

export function clearStudentAccessTokenCookie() {
  cookies().set(STUDENT_PORTAL_AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}


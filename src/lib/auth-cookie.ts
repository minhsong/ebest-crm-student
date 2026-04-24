import { cookies } from 'next/headers';

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
    /** Thời gian sống cookie (browser). Phải khớp với `AUTH_STUDENT_PORTAL_EXPIRES_IN` ở CRM (JWT). */
    maxAge: 60 * 60 * 24 * 30, // 30 days
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


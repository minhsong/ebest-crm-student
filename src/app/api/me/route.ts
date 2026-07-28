import { NextResponse } from 'next/server';
import { toClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';

/**
 * @deprecated Dùng `GET /api/portal/session` — compatibility wrapper 1 release.
 * GET trả portal session client-safe; PATCH đã chuyển sang `/api/student/me`.
 */
export async function GET() {
  try {
    const session = await resolvePortalSessionFromCookies();
    if (session.actor === 'guest') {
      return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
    }
    return NextResponse.json(toClientPortalSessionPayload(session));
  } catch (error) {
    return NextResponse.json(
      sanitizeApiErrorPayload(error, 502),
      { status: 502 },
    );
  }
}

/** @deprecated Dùng `PATCH /api/student/me`. */
export async function PATCH(request: Request) {
  const { PATCH: patchStudentMe } = await import('../student/me/route');
  return patchStudentMe(request);
}

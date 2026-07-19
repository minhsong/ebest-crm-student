import { proxyStudentPostJson } from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyStudentPostJson({
    path: STUDENT_API.authRegisterByToken,
    body: {
      token: typeof body?.token === 'string' ? body.token : '',
      password: typeof body?.password === 'string' ? body.password : '',
    },
    errorFallback: 'Tạo tài khoản thất bại.',
    transform: (raw) => {
      const payload = (raw ?? {}) as Record<string, unknown>;
      return {
        registered: payload.registered === true,
        googleLinked: payload.googleLinked === true,
        message: sanitizeStudentFacingMessage(
          typeof payload.message === 'string' ? payload.message : '',
          'Tạo tài khoản thành công.',
        ),
      };
    },
  });
}

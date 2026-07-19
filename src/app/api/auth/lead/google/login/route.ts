import { proxyPortalGoogleRegisterOrLogin } from '@/lib/portal-auth/portal-google-register-bff.server';

/**
 * @deprecated Dùng `/api/auth/lead/google/register-or-login`.
 * Giữ tương thích — cùng decision flow (không auto-login theo email).
 */
export async function POST(request: Request) {
  return proxyPortalGoogleRegisterOrLogin(request);
}

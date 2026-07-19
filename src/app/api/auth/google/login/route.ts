import { proxyPortalGoogleRegisterOrLogin } from '@/lib/portal-auth/portal-google-register-bff.server';

/** @deprecated Dùng unified Google register-or-login, CRM quyết định actor. */
export async function POST(request: Request) {
  return proxyPortalGoogleRegisterOrLogin(request);
}

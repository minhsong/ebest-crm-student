import { proxyPortalGoogleRegisterOrLogin } from '@/lib/portal-auth/portal-google-register-bff.server';

/** Google register-or-login — CRM quyết định actor; BFF set cookie đúng actor. */
export async function POST(request: Request) {
  return proxyPortalGoogleRegisterOrLogin(request);
}

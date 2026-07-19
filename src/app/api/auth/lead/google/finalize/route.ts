import { proxyPortalGoogleFinalize } from '@/lib/portal-auth/portal-google-register-bff.server';

/** Finalize Google ticket — new Lead / password-link; cookie theo actor CRM. */
export async function POST(request: Request) {
  return proxyPortalGoogleFinalize(request);
}

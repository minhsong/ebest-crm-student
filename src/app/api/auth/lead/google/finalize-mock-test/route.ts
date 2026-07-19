import { proxyPortalGoogleMockTestFastFinalize } from '@/lib/portal-auth/portal-google-register-bff.server';

/** Google mock-test fast finalize — BFF allowlist + cookie Lead/Customer. */
export async function POST(request: Request) {
  return proxyPortalGoogleMockTestFastFinalize(request);
}

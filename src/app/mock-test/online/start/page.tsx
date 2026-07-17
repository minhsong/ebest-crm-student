import { redirect } from 'next/navigation';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { LEAD_COMPLETE_PROFILE_PATH } from '@/lib/portal-auth/session-routes';
import { PortalMockTestOnlineStartClient } from './start-client';

export const dynamic = 'force-dynamic';

/**
 * Entry online — guard read-only (guest/hồ sơ) ở SSR để không nháy spinner;
 * mutation bootstrap thực hiện trong Server Action (POST-only).
 */
export default async function PortalMockTestOnlineStartPage() {
  const principal = await resolvePortalMockTestPrincipal();

  if (principal.actor === 'guest') {
    redirect(
      `/login?mode=lead&returnUrl=${encodeURIComponent(
        PORTAL_MOCK_TEST_ROUTES.onlineStart,
      )}`,
    );
  }

  if (principal.actor === 'lead' && !principal.profileCompleted) {
    redirect(LEAD_COMPLETE_PROFILE_PATH);
  }

  return <PortalMockTestOnlineStartClient />;
}

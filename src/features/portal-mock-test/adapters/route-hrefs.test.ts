import { describe, expect, it } from 'vitest';
import { resolveMockTestHubAccess } from './route-hrefs';
import { PORTAL_MOCK_TEST_ROUTES } from '../routes.config';
import { LEAD_COMPLETE_PROFILE_PATH } from '@/lib/portal-auth/session-routes';
import type { PortalMockTestLeadPrincipal } from '../identity/types';

const incompleteLead = {
  actor: 'lead',
  omniLeadId: 'omni-1',
  leadAccountId: 9,
  displayName: 'Lead',
  phoneE164: '+8490',
  email: '',
  profileCompleted: false,
  profile: {} as PortalMockTestLeadPrincipal['profile'],
} satisfies PortalMockTestLeadPrincipal;

describe('resolveMockTestHubAccess', () => {
  it('customer → online/offline/results hub routes', () => {
    expect(
      resolveMockTestHubAccess({
        actor: 'customer',
        customerId: 1,
        displayName: 'HV',
      }),
    ).toEqual({
      canUse: true,
      onlineHref: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      offlineHref: PORTAL_MOCK_TEST_ROUTES.offline,
      resultsHref: PORTAL_MOCK_TEST_ROUTES.results,
      needsProfileCompletion: false,
    });
  });

  it('lead incomplete profile → complete-profile (not login)', () => {
    expect(resolveMockTestHubAccess(incompleteLead)).toEqual({
      canUse: false,
      onlineHref: LEAD_COMPLETE_PROFILE_PATH,
      offlineHref: LEAD_COMPLETE_PROFILE_PATH,
      resultsHref: LEAD_COMPLETE_PROFILE_PATH,
      needsProfileCompletion: true,
    });
  });

  it('guest → login with returnUrl hub', () => {
    const access = resolveMockTestHubAccess({ actor: 'guest' });
    expect(access.canUse).toBe(false);
    expect(access.onlineHref).toContain('/login?mode=lead');
    expect(access.onlineHref).toContain(
      encodeURIComponent(PORTAL_MOCK_TEST_ROUTES.hub),
    );
  });
});

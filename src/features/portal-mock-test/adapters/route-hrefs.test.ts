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
  googleLinked: false,
  profile: {} as PortalMockTestLeadPrincipal['profile'],
} satisfies PortalMockTestLeadPrincipal;

describe('resolveMockTestHubAccess', () => {
  it('customer → online/offline/results hub routes', () => {
    expect(
      resolveMockTestHubAccess({
        actor: 'customer',
        customerId: 1,
        displayName: 'HV',
        profileCompleted: true,
        phoneE164: '+84901234567',
      }),
    ).toEqual({
      canUse: true,
      onlineHref: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      offlineHref: PORTAL_MOCK_TEST_ROUTES.offline,
      resultsHref: PORTAL_MOCK_TEST_ROUTES.results,
      needsProfileCompletion: false,
    });
  });

  it('customer incomplete after exam → gate results/offline', () => {
    const access = resolveMockTestHubAccess(
      {
        actor: 'customer',
        customerId: 1,
        displayName: 'HV',
        profileCompleted: false,
        phoneE164: null,
      },
      { hasCompletedOnlineExam: true },
    );
    expect(access.needsProfileCompletion).toBe(true);
    expect(access.resultsHref).toContain('profile_required');
  });

  it('lead incomplete profile → online start; results/offline → complete-profile', () => {
    const access = resolveMockTestHubAccess(incompleteLead);
    expect(access.canUse).toBe(true);
    expect(access.onlineHref).toBe(PORTAL_MOCK_TEST_ROUTES.onlineStart);
    expect(access.needsProfileCompletion).toBe(true);
    expect(access.resultsHref).toContain(LEAD_COMPLETE_PROFILE_PATH);
    expect(access.offlineHref).toContain(LEAD_COMPLETE_PROFILE_PATH);
    expect(access.resultsHref).toContain(
      encodeURIComponent(PORTAL_MOCK_TEST_ROUTES.results),
    );
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

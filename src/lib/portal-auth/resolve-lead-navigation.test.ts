import { describe, expect, it } from 'vitest';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { resolveLeadNavigation, resolveLeadRedirectFromSession } from './resolve-lead-navigation';

describe('resolveLeadNavigation', () => {
  const incompleteProfile = {
    id: 1,
    displayName: 'Lead',
    email: 'lead@test.com',
    phoneE164: null,
    emailVerifiedAt: null,
    profileCompleted: false,
  };

  it('layout mode — incomplete trên exam resume path → allow (không ép hub)', () => {
    const result = resolveLeadNavigation({
      actor: 'lead',
      profile: incompleteProfile,
      currentPath: '/mock-test-online/exam/start/abc',
      mode: 'layout',
    });
    expect(result).toEqual({ action: 'allow' });
  });

  it('layout mode — incomplete trên dashboard lead → redirect complete-profile', () => {
    const result = resolveLeadNavigation({
      actor: 'lead',
      profile: incompleteProfile,
      currentPath: '/lead/profile',
      mode: 'layout',
    });
    expect(result.action).toBe('redirect');
    if (result.action === 'redirect') {
      expect(result.destination).toContain('/lead/complete-profile');
    }
  });

  it('postLogin mode — incomplete → hub qua resolveLeadPostLoginDestination (PO-D30)', () => {
    const result = resolveLeadNavigation({
      actor: 'lead',
      profile: incompleteProfile,
      mode: 'postLogin',
    });
    // destination === fallback hub → allow; caller lấy hub
    expect(result).toEqual({ action: 'allow' });
    expect(
      resolveLeadRedirectFromSession(
        {
          status: 'ready',
          actor: 'lead',
          displayName: 'Lead',
          profile: incompleteProfile,
        },
        null,
      ),
    ).toBe(PORTAL_MOCK_TEST_ROUTES.hub);
  });

  it('layout mode — guest → login với returnUrl (không session=expired nếu thiếu authFailure)', () => {
    const result = resolveLeadNavigation({
      actor: 'guest',
      currentPath: '/lead/profile',
      mode: 'layout',
    });
    expect(result).toEqual({
      action: 'redirect',
      destination: '/login?returnUrl=%2Flead%2Fprofile',
    });
  });

  it('layout mode — guest expired → login session=expired', () => {
    const result = resolveLeadNavigation({
      actor: 'guest',
      currentPath: '/lead/profile',
      mode: 'layout',
      authFailure: 'expired',
    });
    expect(result).toEqual({
      action: 'redirect',
      destination: '/login?session=expired&returnUrl=%2Flead%2Fprofile',
    });
  });

  it('resolveLeadRedirectFromSession — guest session → trang chủ lead (hub)', () => {
    expect(
      resolveLeadRedirectFromSession({ status: 'ready', actor: 'guest' }, null),
    ).toBe('/mock-test');
  });

  it('postLogin — đã hoàn thiện giữ returnUrl results; không thì hub', () => {
    const completed = { ...incompleteProfile, profileCompleted: true };
    expect(
      resolveLeadRedirectFromSession(
        {
          status: 'ready',
          actor: 'lead',
          displayName: 'Lead',
          profile: completed,
        },
        null,
      ),
    ).toBe(PORTAL_MOCK_TEST_ROUTES.hub);
    expect(
      resolveLeadRedirectFromSession(
        {
          status: 'ready',
          actor: 'lead',
          displayName: 'Lead',
          profile: completed,
        },
        '/mock-test/results',
      ),
    ).toBe('/mock-test/results');
  });
});

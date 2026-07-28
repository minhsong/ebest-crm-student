import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  invalidateMtoPortalAuthorizeMintCache,
  mintMtoPortalAuthorizeToken,
} from './mint-mto-portal-authorize-token.server';

const getCachedPortalSession = vi.hoisted(() =>
  vi.fn(async () => ({
    actor: 'lead' as const,
    omniLeadId: 'omni-1',
    displayName: 'T',
    accountId: '1',
    profile: {} as never,
  })),
);

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/portal-auth/resolve-portal-session.server', () => ({
  getCachedPortalSession,
}));

vi.mock('@/lib/social-gateway-bff.util', () => ({
  getSocialGatewayConfig: () => ({
    baseUrl: 'http://gw.test',
    serviceToken: 'tok',
  }),
  buildGatewayServiceHeaders: () => ({
    Authorization: 'Bearer tok',
    'Content-Type': 'application/json',
  }),
}));

describe('mintMtoPortalAuthorizeToken cache', () => {
  beforeEach(() => {
    invalidateMtoPortalAuthorizeMintCache();
    fetchMock.mockReset();
    getCachedPortalSession.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        allowed: true,
        portalAuthorizeToken: 'hmac-token',
        portalAuthorizeExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        registrationId: 90,
        formPublicId: 'form-1',
        sessionId: 16,
      }),
    });
  });

  it('reuses minted token within TTL without second GW/CRM round-trip', async () => {
    const a = await mintMtoPortalAuthorizeToken({ registrationId: 90 });
    const b = await mintMtoPortalAuthorizeToken({ registrationId: 90 });
    expect(a?.portalAuthorizeToken).toBe('hmac-token');
    expect(b?.portalAuthorizeToken).toBe('hmac-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedPortalSession).toHaveBeenCalledTimes(1);
  });

  it('forceRefresh bypasses cache', async () => {
    await mintMtoPortalAuthorizeToken({ registrationId: 90 });
    await mintMtoPortalAuthorizeToken({ registrationId: 90, forceRefresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
}));

vi.mock('@/lib/public-mock-test-online/exam-session', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/public-mock-test-online/exam-session')
  >('@/lib/public-mock-test-online/exam-session');
  return {
    ...actual,
    loadMockTestOnlineExamAuth: loadMock,
  };
});

vi.mock('@/lib/public-mock-test-online/exam-auth-refresh-dedupe', () => ({
  rememberMockTestOnlineAuthRefresh: vi.fn(),
  runMockTestOnlineAuthRefreshDeduped: (
    _id: number,
    run: () => Promise<unknown>,
  ) => run(),
}));

vi.mock(
  '@/lib/public-mock-test-online/mock-test-online-authorize-persist.client',
  () => ({
    applyMockTestOnlineAuthorizeResponse: vi.fn(),
  }),
);

vi.mock('@/lib/public-mock-test-online/select-exam-cache', () => ({
  readAnyActiveExamSessionToken: vi.fn(() => null),
}));

import { ensureMockTestOnlineExamAuth } from './exam-auth-refresh.client';

describe('ensureMockTestOnlineExamAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({}),
      })),
    );
  });

  it('returns current session when authorize token is still valid', async () => {
    const auth = {
      registrationId: 12,
      sessionId: 3,
      formPublicId: 'form-1',
      omniLeadId: 'lead-1',
      portalAuthorizeExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    loadMock.mockReturnValue(auth);

    await expect(ensureMockTestOnlineExamAuth()).resolves.toEqual(auth);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refreshes when current authorize token is expired', async () => {
    loadMock
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        registrationId: 12,
        sessionId: 3,
        formPublicId: 'form-1',
        omniLeadId: 'lead-1',
        portalAuthorizeExpiresAt: new Date(Date.now() - 1_000).toISOString(),
      });

    await ensureMockTestOnlineExamAuth(12);
    expect(fetch).toHaveBeenCalled();
  });
});

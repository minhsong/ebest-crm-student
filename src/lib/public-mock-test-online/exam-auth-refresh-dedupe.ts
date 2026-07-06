import type { MockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-session';

/** Dedupe authorize-resume — tránh storm khi React Strict Mode + nhiều component mount. */
const inflightByRegistrationId = new Map<number, Promise<MockTestOnlineExamAuth | null>>();

let lastRefreshAt = 0;
let lastRefreshAuth: MockTestOnlineExamAuth | null = null;

const REFRESH_DEBOUNCE_MS = 3_000;

export function peekMockTestOnlineAuthRefreshCache(
  registrationId: number,
): MockTestOnlineExamAuth | null {
  if (
    lastRefreshAuth?.registrationId === registrationId &&
    Date.now() - lastRefreshAt < REFRESH_DEBOUNCE_MS
  ) {
    return lastRefreshAuth;
  }
  return null;
}

export function rememberMockTestOnlineAuthRefresh(
  auth: MockTestOnlineExamAuth | null,
): void {
  lastRefreshAt = Date.now();
  lastRefreshAuth = auth;
}

export function runMockTestOnlineAuthRefreshDeduped(
  registrationId: number,
  run: () => Promise<MockTestOnlineExamAuth | null>,
): Promise<MockTestOnlineExamAuth | null> {
  const cached = peekMockTestOnlineAuthRefreshCache(registrationId);
  if (cached) {
    return Promise.resolve(cached);
  }

  const existing = inflightByRegistrationId.get(registrationId);
  if (existing) {
    return existing;
  }

  const promise = run().finally(() => {
    inflightByRegistrationId.delete(registrationId);
  });
  inflightByRegistrationId.set(registrationId, promise);
  return promise;
}

export function invalidateMockTestOnlineAuthRefreshCache(): void {
  lastRefreshAt = 0;
  lastRefreshAuth = null;
  inflightByRegistrationId.clear();
}

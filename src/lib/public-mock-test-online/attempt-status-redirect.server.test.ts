import { describe, expect, it } from 'vitest';
import { resolveAttemptRegisterRedirectPath } from './attempt-status-redirect.server';
import type { MockTestOnlineAttemptStatus } from './types';

function baseStatus(
  overrides: Partial<MockTestOnlineAttemptStatus> = {},
): MockTestOnlineAttemptStatus {
  return {
    omniLeadId: 'lead-1',
    testTypeCode: 'toeic_lr',
    verifiedCount: 1,
    maxAttempts: 1,
    remaining: 0,
    globalRemaining: 0,
    sessionCap: null,
    attemptMode: 'retake_zalo',
    activeInExam: null,
    ...overrides,
  };
}

describe('resolveAttemptRegisterRedirectPath', () => {
  it('redirects when remaining is 0 and no active in_exam', () => {
    expect(resolveAttemptRegisterRedirectPath(baseStatus())).toBe(
      '/mock-test/results?notice=attempt_limit',
    );
  });

  it('does not redirect when in_exam resume is allowed even if remaining is 0', () => {
    expect(
      resolveAttemptRegisterRedirectPath(
        baseStatus({
          activeInExam: {
            registrationId: 55,
            sessionId: 12,
            examUnlockExpiresAt: new Date(Date.now() + 60_000).toISOString(),
            pendingRegistrationId: 'pending-1',
            resumeAllowed: true,
          },
        }),
      ),
    ).toBeNull();
  });

  it('redirects when in_exam expired (resume not allowed)', () => {
    expect(
      resolveAttemptRegisterRedirectPath(
        baseStatus({
          activeInExam: {
            registrationId: 55,
            sessionId: 12,
            examUnlockExpiresAt: new Date(Date.now() - 60_000).toISOString(),
            pendingRegistrationId: null,
            resumeAllowed: false,
          },
        }),
      ),
    ).toBe('/mock-test/results?notice=attempt_limit');
  });
});

import { describe, expect, it } from 'vitest';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import {
  getMockTestOnlineAttemptLimitDescription,
  isMockTestOnlineAttemptBlocked,
} from './mock-test-online-attempt-limit.util';

function baseStatus(
  overrides: Partial<MockTestOnlineAttemptStatus> = {},
): MockTestOnlineAttemptStatus {
  return {
    omniLeadId: 'lead1',
    testTypeCode: 'toeic_lr',
    verifiedCount: 1,
    maxAttempts: 1,
    remaining: 0,
    globalRemaining: 0,
    sessionCap: null,
    attemptMode: 'retake_zalo',
    activeInExam: null,
    activeReady: null,
    ...overrides,
  };
}

describe('mock-test-online-attempt-limit.util', () => {
  it('should block when remaining is 0 unless resume allowed', () => {
    expect(isMockTestOnlineAttemptBlocked(baseStatus())).toBe(true);
    expect(
      isMockTestOnlineAttemptBlocked(
        baseStatus({
          remaining: 0,
          activeInExam: {
            registrationId: 1,
            sessionId: 1,
            examUnlockExpiresAt: null,
            pendingRegistrationId: null,
            resumeAllowed: true,
          },
        }),
      ),
    ).toBe(false);
    expect(
      isMockTestOnlineAttemptBlocked(
        baseStatus({
          remaining: 0,
          activeReady: {
            registrationId: 90,
            sessionId: 16,
            examUnlockExpiresAt: null,
            pendingRegistrationId: null,
            resumeAllowed: true,
          },
        }),
      ),
    ).toBe(false);
  });

  it('should use plain Vietnamese for single-attempt exhaustion', () => {
    const copy = getMockTestOnlineAttemptLimitDescription(
      baseStatus({ maxAttempts: 1, verifiedCount: 1 }),
    );
    expect(copy).toContain('1 lượt thi thử online');
    expect(copy).not.toContain('Entitlement');
    expect(copy).not.toContain('enforce');
  });

  it('should prefer session-cap message when session exhausted', () => {
    const copy = getMockTestOnlineAttemptLimitDescription(
      baseStatus({
        remaining: 0,
        globalRemaining: 2,
        maxAttempts: 3,
        sessionCap: {
          sessionId: 9,
          maxAttemptsPerPhone: 1,
          verifiedOnSession: 1,
          sessionRemaining: 0,
        },
      }),
    );
    expect(copy).toContain('chiến dịch này');
  });

  it('should block selected session when sessionCap exhausted even if remaining>0', () => {
    const status = baseStatus({
      remaining: 2,
      globalRemaining: 2,
      maxAttempts: 3,
      verifiedCount: 1,
      sessionCap: {
        sessionId: 16,
        maxAttemptsPerPhone: 1,
        verifiedOnSession: 1,
        sessionRemaining: 0,
      },
    });
    expect(isMockTestOnlineAttemptBlocked(status)).toBe(false);
    expect(isMockTestOnlineAttemptBlocked(status, { sessionId: 16 })).toBe(true);
    expect(isMockTestOnlineAttemptBlocked(status, { sessionId: 99 })).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { resolveMockTestHubOnlineState } from './hub-online-status';

function status(
  overrides: Partial<MockTestOnlineAttemptStatus> = {},
): MockTestOnlineAttemptStatus {
  return {
    omniLeadId: 'omni-1',
    testTypeCode: 'toeic_lr',
    verifiedCount: 0,
    maxAttempts: 3,
    remaining: 3,
    globalRemaining: 3,
    sessionCap: null,
    attemptMode: 'full',
    activeInExam: null,
    ...overrides,
  };
}

describe('resolveMockTestHubOnlineState', () => {
  it('shows available remaining attempts', () => {
    expect(resolveMockTestHubOnlineState(status({ remaining: 2 }))).toEqual({
      kind: 'available',
      label: 'Còn 2 lượt',
    });
  });

  it('prioritizes resumable in-exam over zero remaining', () => {
    expect(
      resolveMockTestHubOnlineState(
        status({
          remaining: 0,
          activeInExam: {
            registrationId: 1,
            sessionId: 2,
            examUnlockExpiresAt: new Date(Date.now() + 60_000).toISOString(),
            pendingRegistrationId: 'pending-1',
            resumeAllowed: true,
          },
        }),
      ),
    ).toEqual({ kind: 'resume', label: 'Có bài đang làm dở' });
  });

  it('shows blocked when no remaining attempt', () => {
    expect(resolveMockTestHubOnlineState(status({ remaining: 0 }))).toEqual({
      kind: 'blocked',
      label: 'Đã hết lượt online',
    });
  });

  it('keeps UI neutral when status is unavailable', () => {
    expect(resolveMockTestHubOnlineState(null)).toEqual({ kind: 'unknown' });
  });
});

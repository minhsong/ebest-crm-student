import { describe, expect, it } from 'vitest';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
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
    activeReady: null,
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
    ).toEqual({
      kind: 'resume',
      label: 'Có bài đang làm dở',
      href: PORTAL_MOCK_TEST_ROUTES.results,
    });
  });

  it('resumes ready lobby when Zalo unlocked but not started', () => {
    expect(
      resolveMockTestHubOnlineState(
        status({
          remaining: 0,
          activeReady: {
            registrationId: 90,
            sessionId: 16,
            examUnlockExpiresAt: null,
            pendingRegistrationId: 'pending-z',
            resumeAllowed: true,
          },
        }),
      ),
    ).toEqual({
      kind: 'resume',
      label: 'Đã mở khóa — sẵn sàng bắt đầu',
      href: '/mock-test-online/exam/ready?registrationId=90',
    });
  });

  it('shows blocked when no remaining attempt', () => {
    expect(resolveMockTestHubOnlineState(status({ remaining: 0 }))).toEqual({
      kind: 'blocked',
      label: 'Đã hết lượt online',
      href: PORTAL_MOCK_TEST_ROUTES.results,
    });
  });

  it('keeps UI neutral when status is unavailable', () => {
    expect(resolveMockTestHubOnlineState(null)).toEqual({ kind: 'unknown' });
  });
});

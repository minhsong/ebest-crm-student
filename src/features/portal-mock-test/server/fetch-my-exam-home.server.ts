import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

export type PortalMockTestExamHome = {
  account?: {
    accountId?: string;
    accountType?: string;
    omniLeadId?: string | null;
    phone?: string | null;
    displayName?: string | null;
    profileCompleted?: boolean | null;
  };
  sessions?: Array<{
    sessionId: number;
    title?: string | null;
    testTypeCode?: string | null;
    status?: string;
  }>;
  pendingZalo?: {
    pendingRegistrationId?: string;
    pendingId?: string;
    sessionId?: number;
    expiresAt?: string;
    serverNow?: string;
    primaryPhoneE164?: string;
  } | null;
  activeAttempt?: {
    resumeAllowed?: boolean;
    registrationId?: number;
    sessionId?: number;
  } | null;
  hasCompletedOnlineExam?: boolean;
  attemptStatus?: MockTestOnlineAttemptStatus | null;
  gates?: {
    requireCompleteProfileBeforeSelect?: boolean;
  };
  serverNow?: string;
};

/**
 * Auth-first MTO home (PO-D28) — CRM portal/mock-test-online/my-exam-home.
 */
export async function fetchPortalMockTestExamHome(): Promise<PortalMockTestExamHome | null> {
  const token = getPortalAccessTokenFromCookie()?.trim();
  const apiBase = getApiBaseUrl();
  if (!token || !apiBase) return null;

  const url = buildCrmStudentUrl(
    apiBase,
    STUDENT_API.portalMockTestExamHome,
  );
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const payload = unwrapCrmResponseBody(data) ?? data;
    return payload && typeof payload === 'object'
      ? (payload as PortalMockTestExamHome)
      : null;
  } catch {
    return null;
  }
}

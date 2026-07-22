import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { getApiBaseUrl } from '@/lib/env';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { STUDENT_API } from '@/lib/student-api';

/**
 * Hub HV — lấy attempt status read-only từ CRM.
 * CRM trả null nếu customer chưa có omniLeadId; không provision khi chỉ xem Hub.
 */
export async function fetchCustomerOnlineAttemptStatusSsr(): Promise<MockTestOnlineAttemptStatus | null> {
  const token = getPortalAccessTokenFromCookie()?.trim();
  const apiBase = getApiBaseUrl();
  if (!token || !apiBase) return null;

  const url = buildCrmStudentUrl(
    apiBase,
    STUDENT_API.customerOnlineAttemptStatus,
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
      ? (payload as MockTestOnlineAttemptStatus)
      : null;
  } catch {
    return null;
  }
}

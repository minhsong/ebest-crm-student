import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

export type StudentMeSsrPayload = {
  customer?: {
    id: number;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    nickname?: string | null;
    primaryEmail?: string;
    primaryPhone?: string;
    avatarUrl?: string | null;
  } | null;
  classes?: Array<{ id: number; name: string; status?: string | null }>;
};

export async function fetchStudentMeForSsr(): Promise<StudentMeSsrPayload | null> {
  const token = getStudentAccessTokenFromCookie();
  const apiBaseUrl = getApiBaseUrl();
  if (!token || !apiBaseUrl) return null;

  try {
    const base = apiBaseUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/v1/student/me`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const payload = (data?.result ?? data?.data ?? data) as StudentMeSsrPayload;
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}


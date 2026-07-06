import type { LeadTestResultSummary } from '@/lib/lead-portal/types';

export async function fetchStudentMockTestResults(): Promise<LeadTestResultSummary[]> {
  const res = await fetch('/api/me/mock-test-results', { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'Không tải được kết quả thi thử.',
    );
  }
  return Array.isArray(data) ? data : (data.items ?? []);
}

export type { LeadTestResultSummary };

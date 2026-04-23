import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

/**
 * Dashboard: pending checklists for current student (JWT-scoped).
 * Forwards Authorization header to CRM `/api/v1/student/checklists`.
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || '';
  return proxyStudentCrmGet(request, `checklists${search}`);
}


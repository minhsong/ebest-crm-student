import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || '';
  return proxyStudentCrmGet(request, `qa${search}`);
}

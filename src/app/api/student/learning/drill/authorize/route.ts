import { NextRequest } from 'next/server';

import { proxyStudentCrmRequest } from '@/lib/student-crm-proxy';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyStudentCrmRequest(request, 'learning/drill/authorize', {
    method: 'POST',
    jsonBody: body,
  });
}

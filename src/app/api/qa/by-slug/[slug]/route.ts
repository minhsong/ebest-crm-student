import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const slug = params.slug;
  return proxyStudentCrmGet(
    request,
    `qa/by-slug/${encodeURIComponent(slug)}`,
  );
}

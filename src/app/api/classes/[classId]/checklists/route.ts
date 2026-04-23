import { NextRequest, NextResponse } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } },
) {
  const raw = params.classId;
  const classId = Number.parseInt(raw, 10);
  if (!Number.isFinite(classId) || classId < 1) {
    return NextResponse.json(
      { message: 'Mã lớp không hợp lệ.' },
      { status: 400 },
    );
  }
  const search = request.nextUrl.search || '';
  return proxyStudentCrmGet(
    request,
    `classes/${classId}/checklists${search}`,
  );
}


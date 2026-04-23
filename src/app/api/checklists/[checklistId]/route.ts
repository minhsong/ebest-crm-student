import { NextRequest, NextResponse } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { checklistId: string } },
) {
  const raw = params.checklistId;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json(
      { message: 'Mã checklist không hợp lệ.' },
      { status: 400 },
    );
  }
  return proxyStudentCrmGet(request, `checklists/${id}`);
}


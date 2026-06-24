import { NextResponse } from 'next/server';
import {
  buildStudentCrmUrl,
  getStudentCrmAuthHeaders,
  STUDENT_CRM_BASE,
  unwrapCrmPayload,
} from '@/lib/crm-student-api';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const headers = getStudentCrmAuthHeaders();
  if (!headers) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const assignmentId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(assignmentId) || assignmentId < 1) {
    return NextResponse.json(
      { message: 'Mã bài tập không hợp lệ.' },
      { status: 400 },
    );
  }

  const url = buildStudentCrmUrl(
    `${STUDENT_CRM_BASE}/assignments/${assignmentId}/submission/writing-draft`,
  );
  if (!url) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data === 'object' && data && 'message' in data
        ? data
        : { message: 'Lưu nháp thất bại.' },
      { status: res.status },
    );
  }

  return NextResponse.json(unwrapCrmPayload(data));
}

import { NextResponse } from 'next/server';
import {
  buildStudentCrmUrl,
  getStudentCrmAuthHeaders,
  STUDENT_CRM_BASE,
  unwrapCrmPayload,
} from '@/lib/crm-student-api';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const headers = getStudentCrmAuthHeaders();
  if (!headers) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const assignmentId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(assignmentId) || assignmentId < 1) {
    return NextResponse.json({ message: 'Mã bài tập không hợp lệ.' }, { status: 400 });
  }

  const url = buildStudentCrmUrl(
    `${STUDENT_CRM_BASE}/assignments/${assignmentId}`,
  );
  if (!url) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }

  const res = await fetch(url, { headers, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data === 'object' && data && 'message' in data
        ? data
        : { message: 'Không tải được bài tập.' },
      { status: res.status },
    );
  }

  return NextResponse.json(unwrapCrmPayload(data));
}

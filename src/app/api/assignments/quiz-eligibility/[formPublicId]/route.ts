import { NextRequest, NextResponse } from 'next/server';
import { unwrapCrmPayload } from '@/lib/crm-payload';
import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const STUDENT_BASE = '/api/v1/student';

/**
 * GET — Lấy quiz eligibility info theo formPublicId.
 * Dùng cho trang xem kết quả để kiểm tra điều kiện hiển thị chi tiết.
 *
 * Query params:
 * - assignmentId (optional): ID của assignment để kiểm tra chính xác
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { formPublicId: string } },
) {
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }
  const formPublicId = params.formPublicId;
  if (!formPublicId || typeof formPublicId !== 'string') {
    return NextResponse.json({ message: 'Mã đề không hợp lệ.' }, { status: 400 });
  }

  // Parse assignmentId từ query params
  const { searchParams } = new URL(request.url);
  const assignmentIdRaw = searchParams.get('assignmentId');
  const assignmentId =
    typeof assignmentIdRaw === 'string' && assignmentIdRaw.trim() !== ''
      ? parseInt(assignmentIdRaw, 10)
      : undefined;
  const parsedAssignmentId = !isNaN(assignmentId as number) ? assignmentId : undefined;

  // Build URL với query param assignmentId nếu có
  let url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/quiz-eligibility/${encodeURIComponent(formPublicId)}`;
  if (parsedAssignmentId !== undefined) {
    url += `?assignmentId=${parsedAssignmentId}`;
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(sanitizeApiErrorPayload(data, res.status), {
      status: res.status,
    });
  }
  return NextResponse.json(unwrapCrmPayload(data) ?? null);
}

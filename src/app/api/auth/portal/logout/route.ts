import { clearLeadAccessTokenCookie } from '@/lib/lead-auth-cookie';
import { clearStudentAccessTokenCookie } from '@/lib/auth-cookie';
import { NextResponse } from 'next/server';

/** Xóa cả cookie học viên + lead (LP-API-02). */
export async function POST() {
  clearStudentAccessTokenCookie();
  clearLeadAccessTokenCookie();
  return NextResponse.json({ ok: true });
}

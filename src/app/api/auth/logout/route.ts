import { NextResponse } from 'next/server';
import { clearStudentAccessTokenCookie } from '@/lib/auth-cookie';

export async function POST() {
  clearStudentAccessTokenCookie();
  return NextResponse.json({ ok: true });
}


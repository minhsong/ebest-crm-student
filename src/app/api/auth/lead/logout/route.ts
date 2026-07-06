import { NextResponse } from 'next/server';
import { clearLeadAccessTokenCookie } from '@/lib/lead-auth-cookie';

export async function POST() {
  clearLeadAccessTokenCookie();
  return NextResponse.json({ ok: true });
}

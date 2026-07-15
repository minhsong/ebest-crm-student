import { clearAllPortalAuthCookies } from '@/lib/portal-auth/portal-auth-session.server';
import { NextResponse } from 'next/server';

/** Xóa cả cookie học viên + lead (LP-API-02 / Q9). */
export async function POST() {
	clearAllPortalAuthCookies();
	return NextResponse.json({ ok: true });
}

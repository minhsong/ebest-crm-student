import { clearAllPortalAuthCookies } from '@/lib/portal-auth/portal-auth-session.server';
import { NextResponse } from 'next/server';

/** Alias → clearAllPortalAuthCookies. UI nên gọi `/api/auth/portal/logout`. */
export async function POST() {
	clearAllPortalAuthCookies();
	return NextResponse.json({ ok: true });
}

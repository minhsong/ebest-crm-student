import { NextResponse } from 'next/server';
import {
  clearLegacyPortalAuthCookies,
  hasLegacyPortalAuthCookies,
} from '@/lib/portal-auth-cookie';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { toClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';

/** Route Handler — canonical client session probe (SSOT). */
export async function GET() {
  if (hasLegacyPortalAuthCookies()) {
    clearLegacyPortalAuthCookies();
  }
  const session = await resolvePortalSessionFromCookies();
  return NextResponse.json(toClientPortalSessionPayload(session));
}

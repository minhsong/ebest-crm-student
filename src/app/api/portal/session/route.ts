import { NextResponse } from 'next/server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { toClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';

export async function GET() {
  const session = await resolvePortalSessionFromCookies();
  return NextResponse.json(toClientPortalSessionPayload(session));
}

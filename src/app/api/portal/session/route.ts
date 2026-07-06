import { NextResponse } from 'next/server';
import {
  resolvePortalSessionFromCookies,
  type PortalSessionPayload,
} from '@/lib/portal-auth/resolve-portal-session.server';

/** Client-safe session DTO — PI-D18 / BL-Q9. */
export type ClientPortalSessionPayload =
  | { actor: 'guest' }
  | { actor: 'customer'; displayName: string }
  | { actor: 'lead'; displayName: string };

export function toClientPortalSessionPayload(
  session: PortalSessionPayload,
): ClientPortalSessionPayload {
  if (session.actor === 'guest') {
    return { actor: 'guest' };
  }
  if (session.actor === 'customer') {
    return { actor: 'customer', displayName: session.displayName };
  }
  return { actor: 'lead', displayName: session.displayName };
}

export async function GET() {
  const session = await resolvePortalSessionFromCookies();
  return NextResponse.json(toClientPortalSessionPayload(session));
}

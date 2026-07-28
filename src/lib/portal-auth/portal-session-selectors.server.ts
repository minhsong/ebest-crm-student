import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';

export type PortalSessionActor = PortalSessionPayload['actor'];

/** Actor từ SSR session — dùng thay vì lặp `session.actor === ...`. */
export function getPortalActorFromSession(
  session: PortalSessionPayload,
): PortalSessionActor {
  return session.actor;
}

export function isAuthenticatedPortalSession(
  session: PortalSessionPayload,
): session is Exclude<PortalSessionPayload, { actor: 'guest' }> {
  return session.actor !== 'guest';
}

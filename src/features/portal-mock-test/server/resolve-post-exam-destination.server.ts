import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import {
  resolvePostExamPath,
  type PostExamPortalSession,
} from '@/lib/portal-auth/session-routes';

export type PostExamDestination = {
  actor: 'guest' | 'lead' | 'customer';
  nextPath: string;
};

/**
 * Quyết định đích sau thi ở server từ session đã verify.
 * Browser chỉ nhận actor + internal path; không nhận profile/identity internals.
 */
export async function resolvePostExamDestination(): Promise<PostExamDestination> {
  const session = await resolvePortalSessionFromCookies();

  let routeSession: PostExamPortalSession;
  if (session.actor === 'lead') {
    routeSession = {
      kind: 'lead',
      profileCompleted: session.profile.profileCompleted === true,
    };
  } else if (session.actor === 'customer') {
    routeSession = { kind: 'customer' };
  } else {
    routeSession = { kind: 'none' };
  }

  return {
    actor: session.actor,
    nextPath: resolvePostExamPath(routeSession),
  };
}

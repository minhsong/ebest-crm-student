import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import type { PortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import type { PortalSessionReadyState } from '@/contexts/portal-session-context';
import { postLoginPathForPortalActor } from '@/lib/portal-auth/portal-session-nav';
import {
  buildLeadCompleteProfilePath,
  isLeadCompleteProfilePath,
  PORTAL_LOGIN_PATH,
  resolvePostLeadLoginPath,
} from '@/lib/portal-auth/session-routes';
import { isLeadIncompleteProfileAllowedPath } from '@/features/portal-mock-test/routes.config';

export type LeadNavigationMode = 'layout' | 'postLogin';

export type LeadNavigationInput = {
  actor: 'guest' | 'customer' | 'lead';
  profile?: PortalLeadSessionSummary | null;
  currentPath?: string | null;
  returnUrl?: string | null;
  allowMockTestFunnel?: boolean;
  /** `postLogin` — sau login; `layout` — gate trong layout (không ép hub PO-D30). */
  mode?: LeadNavigationMode;
};

export type LeadNavigationResult =
  | { action: 'allow' }
  | { action: 'redirect'; destination: string };

/**
 * SSOT điều hướng/gate cho lead.
 * - `postLogin`: hub / re-login sau đăng nhập (PO-D30, UPA-D15).
 * - `layout`: guard profileCompleted trên route — tôn trọng path được phép (exam resume).
 * Guest trên layout lead → login (khu authenticated); funnel public không đi qua resolver này.
 */
export function resolveLeadNavigation(
  input: LeadNavigationInput,
): LeadNavigationResult {
  const {
    actor,
    profile = null,
    currentPath = null,
    returnUrl = null,
    allowMockTestFunnel = false,
    mode = 'layout',
  } = input;

  if (actor === 'guest') {
    return {
      action: 'redirect',
      destination: PORTAL_LOGIN_PATH,
    };
  }

  if (actor === 'customer') {
    return {
      action: 'redirect',
      destination: allowMockTestFunnel
        ? PORTAL_MOCK_TEST_ROUTES.onlineBrowse
        : '/',
    };
  }

  if (actor !== 'lead') {
    return { action: 'allow' };
  }

  if (mode === 'postLogin') {
    const fallback = postLoginPathForPortalActor('lead', returnUrl);
    const destination = resolvePostLeadLoginPath(profile ?? {}, fallback);
    if (destination !== fallback) {
      return { action: 'redirect', destination };
    }
    return { action: 'allow' };
  }

  if (
    profile &&
    !profile.profileCompleted &&
    !isLeadCompleteProfilePath(currentPath) &&
    !isLeadIncompleteProfileAllowedPath(currentPath ?? '')
  ) {
    return {
      action: 'redirect',
      destination: buildLeadCompleteProfilePath(
        currentPath && currentPath !== '/'
          ? currentPath
          : PORTAL_MOCK_TEST_ROUTES.hub,
      ),
    };
  }

  if (profile?.profileCompleted && isLeadCompleteProfilePath(currentPath)) {
    return {
      action: 'redirect',
      destination: PORTAL_MOCK_TEST_ROUTES.hub,
    };
  }

  return { action: 'allow' };
}

/** Đường đi sau login lead — wrapper mỏng trên resolver. */
export function resolveLeadPostLoginDestination(
  profile: PortalLeadSessionSummary | null | undefined,
  returnUrl?: string | null,
): string {
  const result = resolveLeadNavigation({
    actor: 'lead',
    profile,
    returnUrl,
    mode: 'postLogin',
  });
  if (result.action === 'redirect') return result.destination;
  return postLoginPathForPortalActor('lead', returnUrl);
}

/** Post-login redirect path từ session ready state (sau login / Google — không refresh lại). */
export function resolveLeadRedirectFromSession(
  session: PortalSessionReadyState,
  returnUrl?: string | null,
): string {
  if (session.status !== 'ready' || session.actor !== 'lead') {
    return postLoginPathForPortalActor('lead', returnUrl);
  }
  return resolveLeadPostLoginDestination(session.profile, returnUrl);
}

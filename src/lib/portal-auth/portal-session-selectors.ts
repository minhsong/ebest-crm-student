import type { StudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import type { PortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import type { PortalSessionState } from '@/contexts/portal-session-context';

export function isPortalSessionReady(
  session: PortalSessionState,
): session is Extract<PortalSessionState, { status: 'ready' }> {
  return session.status === 'ready';
}

export function getPortalActor(
  session: PortalSessionState,
): 'guest' | 'customer' | 'lead' | null {
  if (!isPortalSessionReady(session)) return null;
  return session.actor;
}

export function getCustomerFromPortalSession(
  session: PortalSessionState,
): StudentMeCustomerBrief | null {
  if (!isPortalSessionReady(session) || session.actor !== 'customer') {
    return null;
  }
  return session.customer;
}

export function getLeadSessionSummary(
  session: PortalSessionState,
): PortalLeadSessionSummary | null {
  if (!isPortalSessionReady(session) || session.actor !== 'lead') {
    return null;
  }
  return session.profile;
}

export function getCustomerClassesFromPortalSession(
  session: PortalSessionState,
): Array<{ id: number; name: string; status?: string | null }> {
  if (!isPortalSessionReady(session) || session.actor !== 'customer') {
    return [];
  }
  return session.classes;
}

export function requireCustomerSession(session: PortalSessionState): {
  customer: StudentMeCustomerBrief;
  classes: Array<{ id: number; name: string; status?: string | null }>;
  displayName: string;
} | null {
  if (!isPortalSessionReady(session) || session.actor !== 'customer') {
    return null;
  }
  return {
    customer: session.customer,
    classes: session.classes,
    displayName: session.displayName,
  };
}

/** Dashboard / customer chrome ready — derive, không cần gateReady state. */
export function isCustomerPortalShellReady(session: PortalSessionState): boolean {
  return (
    isPortalSessionReady(session) &&
    session.actor === 'customer' &&
    Boolean(getCustomerFromPortalSession(session))
  );
}

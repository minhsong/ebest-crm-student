import {
  resolvePortalSessionFromCookies,
  type PortalSessionPayload,
} from '@/lib/portal-auth/resolve-portal-session.server';
import type { PortalMockTestPrincipal } from './types';

function mapLeadSession(
  session: Extract<PortalSessionPayload, { actor: 'lead' }>,
): PortalMockTestPrincipal {
  const { profile } = session;
  return {
    actor: 'lead',
    omniLeadId: profile.omniLeadId,
    leadAccountId: profile.id,
    profileCompleted: profile.profileCompleted !== false,
    phoneE164: profile.phoneE164,
    email: profile.email,
    displayName: session.displayName,
    profile,
  };
}

/** SSOT identity cho hub / bootstrap / results (phase 1: lead). */
export async function resolvePortalMockTestPrincipal(): Promise<PortalMockTestPrincipal> {
  const session = await resolvePortalSessionFromCookies();

  if (session.actor === 'lead') {
    return mapLeadSession(session);
  }

  if (session.actor === 'customer') {
    return {
      actor: 'customer',
      customerId: session.customer.id,
      displayName: session.displayName,
    };
  }

  return { actor: 'guest' };
}

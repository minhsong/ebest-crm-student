import type { LeadProfile } from '@/lib/lead-portal/types';

export type PortalMockTestLeadPrincipal = {
  actor: 'lead';
  omniLeadId: string;
  leadAccountId: number;
  profileCompleted: boolean;
  phoneE164: string;
  email: string;
  displayName: string;
  profile: LeadProfile;
};

/** Phase 2 — portal khóa theo customerId, không omniLeadId. */
export type PortalMockTestCustomerPrincipal = {
  actor: 'customer';
  customerId: number;
  displayName: string;
};

export type PortalMockTestGuestPrincipal = {
  actor: 'guest';
};

export type PortalMockTestPrincipal =
  | PortalMockTestLeadPrincipal
  | PortalMockTestCustomerPrincipal
  | PortalMockTestGuestPrincipal;

export function isLeadMockTestPrincipal(
  p: PortalMockTestPrincipal,
): p is PortalMockTestLeadPrincipal {
  return p.actor === 'lead';
}

export function isPortalMockTestCustomerPrincipal(
  p: PortalMockTestPrincipal,
): p is PortalMockTestCustomerPrincipal {
  return p.actor === 'customer';
}

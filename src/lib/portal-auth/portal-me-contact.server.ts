import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';

/** Contact brief từ SSR session — tránh gọi lại CRM student/me. */
export async function loadLoggedInCustomerContactFromSession(): Promise<{
  displayName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
} | null> {
  const session = await getCachedPortalSession();
  if (session.actor !== 'customer') return null;
  return {
    displayName: session.customer.fullName?.trim() || session.displayName,
    primaryPhone: session.customer.primaryPhone?.trim() || undefined,
    primaryEmail: session.customer.primaryEmail?.trim() || undefined,
  };
}

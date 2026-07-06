import { proxyPortalAuthLoginPost } from '@/lib/portal-auth/portal-auth-login.server';

/** Proxy lead-only login — CRM `POST /student/auth/lead/login` (BL-Q8: không fallback customer). */
export async function POST(request: Request) {
  return proxyPortalAuthLoginPost(request, 'lead');
}

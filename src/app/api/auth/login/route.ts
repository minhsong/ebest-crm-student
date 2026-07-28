import { proxyPortalAuthLoginPost } from '@/lib/portal-auth/portal-auth-login.server';

/** Proxy password login thống nhất — CRM `POST /student/auth/login`. */
export async function POST(request: Request) {
  return proxyPortalAuthLoginPost(request);
}

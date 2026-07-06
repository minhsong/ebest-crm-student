import { NextResponse } from 'next/server';
import { proxyPortalAuthLoginPost } from '@/lib/portal-auth/portal-auth-login.server';

/** Proxy customer login — CRM `POST /student/auth/login` (chỉ học viên). */
export async function POST(request: Request) {
  return proxyPortalAuthLoginPost(request, 'customer');
}

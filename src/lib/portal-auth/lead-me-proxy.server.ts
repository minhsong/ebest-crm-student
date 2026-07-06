import { NextResponse } from 'next/server';
import { fetchLeadMeBffResponse } from '@/lib/lead-portal/lead-me-bff.server';

export async function proxyLeadMeWithIdentityUpgrade(): Promise<NextResponse> {
  return fetchLeadMeBffResponse();
}

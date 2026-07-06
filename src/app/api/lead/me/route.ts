import { NextResponse } from 'next/server';
import {
  fetchLeadMeBffResponse,
  patchLeadMeBffResponse,
} from '@/lib/lead-portal/lead-me-bff.server';

export async function GET() {
  return fetchLeadMeBffResponse();
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  return patchLeadMeBffResponse(body);
}

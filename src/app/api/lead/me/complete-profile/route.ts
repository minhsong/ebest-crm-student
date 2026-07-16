import { completeLeadProfileBffResponse } from '@/lib/lead-portal/lead-me-bff.server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return completeLeadProfileBffResponse(body);
}

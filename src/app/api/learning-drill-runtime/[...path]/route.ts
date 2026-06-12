import { NextRequest } from 'next/server';

import { proxyDrillRuntimeToGateway } from '@/lib/learning-drill-gateway-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyDrillRuntimeToGateway(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyDrillRuntimeToGateway(request, path);
}

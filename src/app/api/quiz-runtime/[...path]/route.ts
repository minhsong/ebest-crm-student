import { NextRequest } from 'next/server';

import { proxyQuizRuntimeToGateway } from '@/lib/quiz-runtime-gateway-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyQuizRuntimeToGateway(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyQuizRuntimeToGateway(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyQuizRuntimeToGateway(request, path);
}

/**
 * Bọc Route Handler MTO — gắn requestId ALS trước khi chạy logic.
 * Intermediate lỗi: logAndRethrowMtoError; terminal: mockTestBffCatchResponse.
 */
import type { NextRequest } from 'next/server';
import {
  resolvePortalRequestIdFromHeaders,
  runWithPortalRequestIdAsync,
} from '@/lib/portal-request-context';

export async function withMtoBffRequest<T>(
  req: Request | NextRequest,
  fn: (requestId: string) => Promise<T>,
): Promise<T> {
  const requestId = resolvePortalRequestIdFromHeaders(req.headers);
  return runWithPortalRequestIdAsync(requestId, () => fn(requestId));
}

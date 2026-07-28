'use server';

import { runPortalOnlineBootstrap } from '@/features/portal-mock-test/server/run-portal-online-bootstrap.server';

export type StartOnlineBootstrapState =
  | { redirectTo: string; traceId: string }
  | { error: string; traceId: string }
  | null;

/**
 * Thin wrapper — logic nằm ở `runPortalOnlineBootstrap`.
 * Prefer Route Handler POST `/api/mock-test/bootstrap-online` (dễ debug Network).
 */
export async function startPortalOnlineBootstrapAction(): Promise<StartOnlineBootstrapState> {
  const result = await runPortalOnlineBootstrap();
  if (result.ok) {
    return { redirectTo: result.redirectTo, traceId: result.traceId };
  }
  return { error: result.error, traceId: result.traceId };
}

const PREFIX = '[MTO_DEBUG]';

function isBrowserDebug(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_TEST_ONLINE_DEBUG === 'true';
}

function isServerDebug(): boolean {
  return (
    process.env.MOCK_TEST_ONLINE_DEBUG === 'true' ||
    process.env.NEXT_PUBLIC_MOCK_TEST_ONLINE_DEBUG === 'true'
  );
}

/** Client component — log ra browser console (export từ DevTools). */
export function mtoClientDebug(
  event: string,
  payload: Record<string, unknown>,
): void {
  if (typeof window === 'undefined' || !isBrowserDebug()) return;
  console.info(PREFIX, event, { ts: new Date().toISOString(), ...payload });
}

/** Portal BFF / server — log ra terminal (tee vào file). */
export function mtoServerDebug(
  event: string,
  payload: Record<string, unknown>,
): void {
  if (!isServerDebug()) return;
  console.info(
    PREFIX,
    JSON.stringify({
      event: `mto.debug.${event}`,
      ts: new Date().toISOString(),
      ...payload,
    }),
  );
}

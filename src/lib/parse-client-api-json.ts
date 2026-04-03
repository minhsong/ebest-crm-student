/**
 * Parse message từ response JSON của API route nội bộ (đã unwrap giống CRM).
 */

export function getMessageFromClientApiJson(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  if (typeof o.message === 'string' && o.message.trim()) return o.message;
  const inner = o.result ?? o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const m = (inner as Record<string, unknown>).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return undefined;
}

/** CRM thường bọc { result } — dùng được cả client lẫn server (không import next/headers). */
export function unwrapCrmPayload<T = unknown>(data: unknown): T {
  if (data != null && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (o.result != null) return o.result as T;
    if (o.data != null) return o.data as T;
  }
  return data as T;
}

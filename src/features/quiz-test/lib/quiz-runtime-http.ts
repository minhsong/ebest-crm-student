export async function fetchQuizRuntimeJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

'use client';

import { useCallback, useState } from 'react';
import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';

type UseChangePasswordOptions = {
  endpoint: string;
  fetchInit?: Omit<RequestInit, 'method' | 'body' | 'headers'> & {
    headers?: Record<string, string>;
  };
};

export function useChangePassword({ endpoint, fetchInit }: UseChangePasswordOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      setDone(false);
      try {
        const res = await fetch(endpoint, {
          ...fetchInit,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...fetchInit?.headers,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message =
            getMessageFromClientApiJson(data) ??
            (typeof data?.message === 'string'
              ? data.message
              : 'Đổi mật khẩu thất bại.');
          setError(message);
          return { ok: false as const, message };
        }
        setDone(true);
        return {
          ok: true as const,
          message:
            typeof data?.message === 'string'
              ? data.message
              : 'Đổi mật khẩu thành công.',
        };
      } catch {
        const message = 'Không thể kết nối. Vui lòng thử lại.';
        setError(message);
        return { ok: false as const, message };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, fetchInit],
  );

  const reset = useCallback(() => {
    setError(null);
    setDone(false);
  }, []);

  return { loading, error, done, submit, reset, setError };
}

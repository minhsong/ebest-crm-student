'use client';

import { useCallback, useState } from 'react';
import {
  postForgotPassword,
  postResetPassword,
} from '@/lib/password-recovery';
import type { PortalLoginMode } from '@/components/portal/PortalLoginModePicker';

const DEFAULT_FORGOT_SUCCESS =
  'Đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).';

/**
 * Quên mật khẩu — gọi API, quản lý loading / lỗi.
 */
export function useForgotPassword(mode: PortalLoginMode = 'customer') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (loginId: string) => {
      setError(null);
      setLoading(true);
      try {
        const result = await postForgotPassword(loginId, mode);
        const msg = result.message ?? DEFAULT_FORGOT_SUCCESS;
        if (!result.ok) {
          setError(msg || 'Không thể gửi yêu cầu.');
          return { ok: false as const, message: msg };
        }
        return { ok: true as const, message: msg };
      } catch {
        setError('Không thể kết nối. Vui lòng thử lại.');
        return { ok: false as const, message: undefined };
      } finally {
        setLoading(false);
      }
    },
    [mode],
  );

  return { loading, error, submit, setError };
}

const DEFAULT_RESET_FAIL =
  'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.';

/**
 * Đặt lại mật khẩu — token từ query email.
 */
export function useResetPassword(mode: PortalLoginMode = 'customer') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (token: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        const result = await postResetPassword(token, password, mode);
      const msg =
        result.message ??
        (result.ok ? 'Đặt lại mật khẩu thành công.' : DEFAULT_RESET_FAIL);
      if (!result.ok) {
        setError(msg);
        return { ok: false as const, message: msg };
      }
      return { ok: true as const, message: msg };
    } catch {
      setError('Không thể kết nối. Vui lòng thử lại.');
      return { ok: false as const, message: undefined };
    } finally {
      setLoading(false);
    }
  }, [mode]);

  return { loading, error, submit, setError };
}

'use client';

import { useCallback, useState } from 'react';
import {
  postForgotPassword,
  postResetPassword,
} from '@/lib/password-recovery';

const DEFAULT_FORGOT_HINT =
  'Nếu email đã đăng ký trong hệ thống, bạn sẽ nhận hướng dẫn đặt lại mật khẩu qua email.';

/**
 * Quên mật khẩu — gọi API, quản lý loading / lỗi.
 */
export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await postForgotPassword(email);
      const msg = result.message ?? DEFAULT_FORGOT_HINT;
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
  }, []);

  return { loading, error, submit, setError };
}

const DEFAULT_RESET_FAIL =
  'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.';

/**
 * Đặt lại mật khẩu — token từ query email.
 */
export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (token: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await postResetPassword(token, password);
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
  }, []);

  return { loading, error, submit, setError };
}

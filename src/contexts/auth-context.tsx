'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
import { parseGoogleLoginPayload } from '@/lib/parse-google-login-result';
import {
  parseStudentMeCustomerBrief,
  type StudentMeCustomerBrief,
} from '@/lib/parse-student-me-customer';

export type AuthCustomer = StudentMeCustomerBrief;

interface AuthState {
  customer: AuthCustomer | null;
  ready: boolean;
}

export type LoginWithGoogleResult =
  | { ok: true; kind: 'session' }
  | {
      ok: true;
      kind: 'complete_profile';
      completeProfileUrl: string;
      reason: 'incomplete_profile' | 'needs_password';
    }
  | { ok: false; message?: string };

interface AuthContextValue extends AuthState {
  login: (loginId: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  loginWithGoogle: (idToken: string) => Promise<LoginWithGoogleResult>;
  linkGoogle: (idToken: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  refreshSession: () => Promise<void>;
}

const defaultState: AuthState = {
  customer: null,
  ready: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialCustomer,
}: {
  children: React.ReactNode;
  initialCustomer?: AuthCustomer | null;
}) {
  const [state, setState] = useState<AuthState>(() => ({
    customer: initialCustomer ?? null,
    ready: !!initialCustomer,
  }));

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { method: 'GET' });
      if (!res.ok) {
        setState({ customer: null, ready: true });
        return;
      }
      const payload = await res.json().catch(() => ({}));
      const raw = payload?.customer ?? payload;
      const customer = parseStudentMeCustomerBrief(raw);
      if (!customer) {
        setState({ customer: null, ready: true });
        return;
      }
      setState({ customer, ready: true });
    } catch {
      setState({ customer: null, ready: true });
    }
  }, []);

  useEffect(() => {
    if (initialCustomer) return;
    void refreshSession();
  }, [refreshSession, initialCustomer]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setState({ customer: null, ready: true });
  }, []);

  const login = useCallback(
    async (loginId: string, password: string) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            ok: false,
            message:
              getMessageFromClientApiJson(data) ??
              (typeof data?.message === 'string' ? data.message : 'Đăng nhập thất bại.'),
          };
        }
        await refreshSession();
        return { ok: true };
      } catch {
        return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
      }
    },
    [refreshSession]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string): Promise<LoginWithGoogleResult> => {
      try {
        const res = await fetch('/api/auth/google/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const data = await res.json().catch(() => ({}));
        const payload = data?.result ?? data?.data ?? data;
        if (!res.ok) {
          return {
            ok: false,
            message:
              getMessageFromClientApiJson(data) ??
              (typeof payload === 'object' &&
              payload &&
              'message' in payload &&
              typeof (payload as { message?: string }).message === 'string'
                ? (payload as { message: string }).message
                : 'Đăng nhập Google thất bại.'),
          };
        }
        const parsed = parseGoogleLoginPayload(payload);
        if (parsed.kind === 'complete_profile') {
          return {
            ok: true,
            kind: 'complete_profile',
            completeProfileUrl: parsed.completeProfileUrl,
            reason: parsed.reason,
          };
        }
        if (parsed.kind === 'session') {
          await refreshSession();
          return { ok: true, kind: 'session' };
        }
        return { ok: false, message: 'Dữ liệu đăng nhập không hợp lệ.' };
      } catch {
        return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
      }
    },
    [refreshSession]
  );

  const linkGoogle = useCallback(async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/google/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          message:
            getMessageFromClientApiJson(data) ??
            (typeof data?.message === 'string' ? data.message : 'Liên kết Google thất bại.'),
        };
      }
      return { ok: true, message: typeof data?.message === 'string' ? data.message : undefined };
    } catch {
      return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
    }
  }, []);

  /** Gọi API nội bộ / CRM — token nằm trong httpOnly cookie (server tự inject Authorization). */
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const res = await fetch(url, { ...options });
      if (res.status === 401) {
        await logout();
        if (typeof window !== 'undefined') {
          const { pathname, search } = window.location;
          if (!pathname.startsWith('/login')) {
            const next = encodeURIComponent(`${pathname}${search}`);
            window.location.assign(`/login?session=expired&redirect=${next}`);
          }
        }
      }
      return res;
    },
    [logout]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithGoogle,
    linkGoogle,
    logout,
    fetchWithAuth,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

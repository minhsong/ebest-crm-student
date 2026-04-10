'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
import { parseGoogleLoginPayload } from '@/lib/parse-google-login-result';

const STORAGE_KEY = 'student_portal_auth';

export interface AuthCustomer {
  id: number;
  fullName: string;
  primaryEmail?: string;
  primaryPhone?: string;
}

interface AuthState {
  accessToken: string | null;
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
  logout: () => void;
  setAuth: (accessToken: string, customer: AuthCustomer) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const defaultState: AuthState = {
  accessToken: null,
  customer: null,
  ready: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): Partial<AuthState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { accessToken?: string; customer?: AuthCustomer };
    if (parsed.accessToken && parsed.customer) {
      return { accessToken: parsed.accessToken, customer: parsed.customer };
    }
  } catch {}
  return {};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...defaultState });

  useEffect(() => {
    const stored = loadStored();
    setState((s) => ({
      ...s,
      ...stored,
      ready: true,
    }));
  }, []);

  const persist = useCallback((accessToken: string, customer: AuthCustomer) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken, customer })
    );
    setState({ accessToken, customer, ready: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ accessToken: null, customer: null, ready: true });
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
                : 'Đăng nhập thất bại.'),
          };
        }
        const token = (payload as { accessToken?: string })?.accessToken;
        const customer = (payload as { customer?: AuthCustomer })?.customer;
        if (!token || !customer) {
          return { ok: false, message: 'Dữ liệu đăng nhập không hợp lệ.' };
        }
        persist(token, {
          id: customer.id,
          fullName: customer.fullName ?? 'Học viên',
          primaryEmail: customer.primaryEmail,
          primaryPhone: customer.primaryPhone,
        });
        return { ok: true };
      } catch {
        return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
      }
    },
    [persist]
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
          persist(parsed.accessToken, parsed.customer);
          return { ok: true, kind: 'session' };
        }
        return { ok: false, message: 'Dữ liệu đăng nhập không hợp lệ.' };
      } catch {
        return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
      }
    },
    [persist]
  );

  const linkGoogle = useCallback(async (idToken: string) => {
    try {
      const token = state.accessToken ?? loadStored().accessToken;
      const res = await fetch('/api/auth/google/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  }, [state.accessToken]);

  /** Gọi API nội bộ / CRM — luôn gắn Bearer của học viên đang đăng nhập (server suy ra customerId). */
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = state.accessToken ?? loadStored().accessToken;
      const headers = new Headers(options.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return fetch(url, { ...options, headers });
    },
    [state.accessToken]
  );

  const setAuth = useCallback(
    (accessToken: string, customer: AuthCustomer) => {
      persist(accessToken, customer);
    },
    [persist]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithGoogle,
    linkGoogle,
    logout,
    setAuth,
    fetchWithAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

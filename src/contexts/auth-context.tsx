'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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

interface AuthContextValue extends AuthState {
  login: (loginId: string, password: string) => Promise<{ ok: boolean; message?: string }>;
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
          return { ok: false, message: data?.message ?? payload?.message ?? 'Đăng nhập thất bại.' };
        }
        const token = payload?.accessToken;
        const customer = payload?.customer;
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

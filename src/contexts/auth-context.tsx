'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
import {
  parseStudentMeCustomerBrief,
  type StudentMeCustomerBrief,
} from '@/lib/parse-student-me-customer';

import type { PortalLoginMode } from '@/components/portal/PortalLoginModePicker';
import { portalLoginPath } from '@/lib/portal-auth/portal-login-api';
import { usePortalSession } from '@/contexts/portal-session-context';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';

export type AuthCustomer = StudentMeCustomerBrief;

export interface AuthState {
  customer: AuthCustomer | null;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  login: (
    loginId: string,
    password: string,
    options?: { mode?: PortalLoginMode },
  ) => Promise<{ ok: boolean; actor?: 'customer' | 'lead'; message?: string }>;
  linkGoogle: (idToken: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Customer profile + HV APIs (fetchWithAuth).
 * Identity actor SSOT = PortalSessionProvider; logout đồng bộ portal session.
 */
export function AuthProvider({
  children,
  initialCustomer,
}: {
  children: React.ReactNode;
  initialCustomer?: AuthCustomer | null;
}) {
  const portal = usePortalSession();
  const portalStatus = portal.status;
  const portalActor = portal.status === 'ready' ? portal.actor : null;
  const refreshPortalSession = portal.refresh;
  const logoutPortalSession = portal.logout;
  const [state, setState] = useState<AuthState>(() => ({
    customer: initialCustomer ?? null,
    ready: Boolean(initialCustomer),
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
    if (portalStatus !== 'ready') return;

    if (portalActor !== 'customer') {
      setState({ customer: null, ready: true });
      return;
    }

    if (initialCustomer) {
      setState({ customer: initialCustomer, ready: true });
      return;
    }

    void refreshSession();
  }, [portalStatus, portalActor, initialCustomer, refreshSession]);

  const logout = useCallback(async () => {
    await logoutPortalSession();
    setState({ customer: null, ready: true });
  }, [logoutPortalSession]);

  const login = useCallback(
    async (
      loginId: string,
      password: string,
      options?: { mode?: PortalLoginMode },
    ) => {
      const mode = options?.mode ?? 'customer';
      try {
        const res = await fetch(portalLoginPath(mode), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const fallback =
            mode === 'lead'
              ? 'Đăng nhập thất bại. Nếu bạn là học viên Ebest, hãy chọn «Đang là học viên Ebest» ở trên.'
              : 'Đăng nhập thất bại.';
          return {
            ok: false,
            message:
              getMessageFromClientApiJson(data) ??
              (typeof data?.message === 'string' ? data.message : fallback),
          };
        }
        const actor: 'customer' | 'lead' =
          data?.actor === 'lead' ? 'lead' : 'customer';
        await refreshPortalSession();
        if (actor === 'lead') {
          return { ok: true, actor: 'lead' as const };
        }
        await refreshSession();
        return { ok: true, actor: 'customer' as const };
      } catch {
        return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
      }
    },
    [refreshSession, refreshPortalSession],
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
            (typeof data?.message === 'string'
              ? data.message
              : 'Liên kết Google thất bại.'),
        };
      }
      return {
        ok: true,
        message: typeof data?.message === 'string' ? data.message : undefined,
      };
    } catch {
      return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
    }
  }, []);

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const res = await fetch(url, { ...options });
      if (res.status === 401) {
        await logout();
        if (typeof window !== 'undefined') {
          const { pathname, search } = window.location;
          if (!pathname.startsWith('/login')) {
            window.location.assign(
              buildPortalLoginHref({
                sessionExpired: true,
                returnUrl: `${pathname}${search}`,
              }),
            );
          }
        }
      }
      return res;
    },
    [logout],
  );

  const value: AuthContextValue = {
    ...state,
    login,
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

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
import { type StudentMeCustomerBrief } from '@/lib/parse-student-me-customer';

import { portalLoginPath } from '@/lib/portal-auth/portal-login-api';
import { usePortalSession } from '@/contexts/portal-session-context';
import type { PortalSessionReadyState } from '@/contexts/portal-session-context';
import {
  getCustomerFromPortalSession,
  isPortalSessionReady,
} from '@/lib/portal-auth/portal-session-selectors';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import { portalLogoutAndLeave } from '@/lib/portal-auth/portal-session.client';

export type AuthCustomer = StudentMeCustomerBrief;

export interface AuthState {
  customer: AuthCustomer | null;
  ready: boolean;
}

interface AuthActions {
  login: (
    loginId: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    actor?: 'customer' | 'lead';
    session?: PortalSessionReadyState;
    message?: string;
  }>;
  linkGoogle: (idToken: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  refreshSession: () => Promise<void>;
}

type AuthContextValue = AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Imperative auth actions (login/logout/fetchWithAuth).
 * Identity + customer profile SSOT = PortalSessionProvider + selectors.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const portal = usePortalSession();
  const refreshPortalSession = portal.refresh;
  const logoutPortalSession = portal.logout;

  const refreshSession = useCallback(async () => {
    await refreshPortalSession();
  }, [refreshPortalSession]);

  const logout = useCallback(async () => {
    await logoutPortalSession();
  }, [logoutPortalSession]);

  const login = useCallback(
    async (loginId: string, password: string) => {
      try {
        const res = await fetch(portalLoginPath(), {
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
              (typeof data?.message === 'string'
                ? data.message
                : 'Đăng nhập thất bại.'),
          };
        }
        const actor: 'customer' | 'lead' =
          data?.actor === 'lead' ? 'lead' : 'customer';
        const session = await refreshPortalSession();
        return { ok: true, actor, session };
      } catch {
        return { ok: false, message: 'Không thể kết nối. Vui lòng thử lại.' };
      }
    },
    [refreshPortalSession],
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
      if (res.status === 401 && typeof window !== 'undefined') {
        const { pathname, search } = window.location;
        const href = pathname.startsWith('/login')
          ? buildPortalLoginHref({ sessionExpired: true, returnUrl: '/' })
          : buildPortalLoginHref({
              sessionExpired: true,
              returnUrl: `${pathname}${search}`,
            });
        // Một lần clear + assign — không gọi portal.logout (tránh double /login).
        await portalLogoutAndLeave(href);
      }
      return res;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      login,
      linkGoogle,
      logout,
      fetchWithAuth,
      refreshSession,
    }),
    [login, linkGoogle, logout, fetchWithAuth, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Auth actions + derived customer state từ portal session. */
export function useAuth(): AuthContextValue & AuthState {
  const actions = useContext(AuthContext);
  const portal = usePortalSession();
  if (!actions) throw new Error('useAuth must be used within AuthProvider');

  const ready = isPortalSessionReady(portal);
  const customer = useMemo(
    () => getCustomerFromPortalSession(portal),
    [portal],
  );

  return useMemo(
    () => ({
      ...actions,
      customer,
      ready,
    }),
    [actions, customer, ready],
  );
}

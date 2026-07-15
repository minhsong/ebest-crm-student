'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PortalSiteLinks } from '@/lib/portal-course-catalog/types';
import { DEFAULT_PORTAL_LOCALE } from '@/lib/portal-course-catalog/types';
import {
  MESSENGER_CHAT_URL,
  ZALO_OA_CHAT_URL,
} from '@/lib/ui-constants';

export type PortalContactLinks = {
  loading: boolean;
  messengerUrl: string;
  zaloUrl: string;
  aboutUrl: string | null;
  siteLinks: PortalSiteLinks | null;
  refresh: () => void;
};

const FALLBACK: Omit<PortalContactLinks, 'loading' | 'refresh' | 'siteLinks'> = {
  messengerUrl: MESSENGER_CHAT_URL,
  zaloUrl: ZALO_OA_CHAT_URL,
  aboutUrl: null,
};

const PortalContactLinksContext = createContext<PortalContactLinks | null>(null);

function normalizeSiteLinks(data: unknown): PortalSiteLinks | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const zaloChatUrl =
    typeof o.zaloChatUrl === 'string' ? o.zaloChatUrl.trim() : '';
  const facebookMessengerUrl =
    typeof o.facebookMessengerUrl === 'string'
      ? o.facebookMessengerUrl.trim()
      : '';
  if (!zaloChatUrl && !facebookMessengerUrl) return null;
  return {
    locale:
      typeof o.locale === 'string' && o.locale.trim()
        ? o.locale.trim()
        : DEFAULT_PORTAL_LOCALE,
    aboutUrl: typeof o.aboutUrl === 'string' ? o.aboutUrl.trim() : '',
    zaloChatUrl,
    facebookMessengerUrl,
  };
}

type ProviderProps = {
  locale?: string;
  children: ReactNode;
};

/**
 * SSOT liên hệ Portal — lấy từ CRM `portal_site_links` (BFF `/api/portal/site-links`).
 * Cấu hình tại CRM: Portal học viên → Catalog khóa học → tab «Liên kết site».
 */
export function PortalContactLinksProvider({
  locale = DEFAULT_PORTAL_LOCALE,
  children,
}: ProviderProps) {
  const [loading, setLoading] = useState(true);
  const [siteLinks, setSiteLinks] = useState<PortalSiteLinks | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/portal/site-links?locale=${encodeURIComponent(locale)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const json = (await res.json()) as unknown;
        const nested =
          json && typeof json === 'object' && 'data' in (json as object)
            ? (json as { data: unknown }).data
            : json;
        const parsed = normalizeSiteLinks(nested);
        if (!cancelled && parsed) setSiteLinks(parsed);
      } catch {
        // giữ fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, tick]);

  const value = useMemo<PortalContactLinks>(() => {
    return {
      loading,
      messengerUrl:
        siteLinks?.facebookMessengerUrl?.trim() || FALLBACK.messengerUrl,
      zaloUrl: siteLinks?.zaloChatUrl?.trim() || FALLBACK.zaloUrl,
      aboutUrl: siteLinks?.aboutUrl?.trim() || null,
      siteLinks,
      refresh,
    };
  }, [loading, siteLinks, refresh]);

  return (
    <PortalContactLinksContext.Provider value={value}>
      {children}
    </PortalContactLinksContext.Provider>
  );
}

export function usePortalContactLinks(): PortalContactLinks {
  const ctx = useContext(PortalContactLinksContext);
  if (!ctx) {
    return {
      loading: false,
      ...FALLBACK,
      siteLinks: null,
      refresh: () => undefined,
    };
  }
  return ctx;
}

/** Alias CTA «Fanpage» = Messenger chat từ CRM. */
export function useFanpageContactUrl(): string {
  return usePortalContactLinks().messengerUrl;
}

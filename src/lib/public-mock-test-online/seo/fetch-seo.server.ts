import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import {
  MOCK_TEST_ONLINE_LANDING_CANONICAL_URL,
  MOCK_TEST_ONLINE_SEO_FALLBACK,
} from './constants';
import type { MockTestOnlineSeoConfig } from './types';

const SEO_REVALIDATE_SEC = 300;

function resolvePortalOrigin(): string {
  const configured = process.env.STUDENT_PORTAL_ORIGIN?.trim();
  if (configured) return configured.replace(/\/$/, '');
  const site =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    '';
  return site ? site.replace(/\/$/, '') : '';
}

function mergeSeoConfig(raw: Partial<MockTestOnlineSeoConfig> | null): MockTestOnlineSeoConfig {
  const origin = resolvePortalOrigin();
  const defaultCanonical = origin
    ? `${origin}/mock-test-online/register`
    : MOCK_TEST_ONLINE_SEO_FALLBACK.landing.canonicalUrl;

  const envCanonical = MOCK_TEST_ONLINE_LANDING_CANONICAL_URL;
  const forceEmbed = Boolean(envCanonical);

  const landing = { ...MOCK_TEST_ONLINE_SEO_FALLBACK.landing, ...raw?.landing };
  const embed = { ...MOCK_TEST_ONLINE_SEO_FALLBACK.embed, ...raw?.embed };
  const schema = { ...MOCK_TEST_ONLINE_SEO_FALLBACK.schema, ...raw?.schema };

  return {
    landing: {
      ...landing,
      indexable: forceEmbed ? false : landing.indexable,
      canonicalUrl: envCanonical || landing.canonicalUrl || defaultCanonical,
    },
    embed,
    faq: Array.isArray(raw?.faq) && raw.faq.length > 0 ? raw.faq : MOCK_TEST_ONLINE_SEO_FALLBACK.faq,
    schema,
  };
}

/** Đọc SEO từ CRM (`mock_test_online_seo` + Redis). ISR 5 phút trên Portal. */
export async function fetchMockTestOnlineSeo(): Promise<MockTestOnlineSeoConfig> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return mergeSeoConfig(null);
  }

  const origin = resolvePortalOrigin();
  const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/seo`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(origin ? { Origin: origin, Referer: `${origin}/mock-test-online/register` } : {}),
      },
      next: { revalidate: SEO_REVALIDATE_SEC },
    });
    if (!res.ok) {
      return mergeSeoConfig(null);
    }
    const body = await res.json();
    const data = unwrapCrmResponseBody(body) as Partial<MockTestOnlineSeoConfig> | null;
    return mergeSeoConfig(data);
  } catch {
    return mergeSeoConfig(null);
  }
}

export function pickSeoWidgetCopy(seo: MockTestOnlineSeoConfig) {
  return {
    widgetTitle: seo.landing.widgetTitle,
    widgetIntro: seo.landing.widgetIntro,
  };
}

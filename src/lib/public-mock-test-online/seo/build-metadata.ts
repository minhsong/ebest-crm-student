import type { Metadata } from 'next';
import {
  buildEmbedPageMetadata,
  buildPageMetadata,
  getSiteUrl,
} from '@/lib/metadata';
import type { MockTestOnlineSeoConfig } from './types';

function resolveCanonical(seo: MockTestOnlineSeoConfig): string {
  const fromConfig = seo.landing.canonicalUrl?.trim();
  if (fromConfig) return fromConfig;
  const site = getSiteUrl();
  return site ? `${site}/mock-test-online/register` : '';
}

function ogImagePath(seo: MockTestOnlineSeoConfig): string {
  const path = seo.landing.ogImagePath?.trim() || '/og-image.png';
  return path.startsWith('/') ? path : `/${path}`;
}

/** Metadata trang đăng ký chính — index hoặc noindex theo CRM Settings. */
export function buildMockTestOnlineLandingMetadata(
  seo: MockTestOnlineSeoConfig,
): Metadata {
  const canonicalUrl = resolveCanonical(seo);
  const ogImage = ogImagePath(seo);

  if (!seo.landing.indexable && canonicalUrl) {
    const base = buildEmbedPageMetadata({
      title: seo.landing.title,
      description: seo.landing.description,
      path: '/mock-test-online/register',
      canonicalUrl,
    });
    return {
      ...base,
      openGraph: {
        ...base.openGraph,
        images: [{ url: ogImage, width: 600, height: 150, alt: 'Ebest English' }],
      },
    };
  }

  const base = buildPageMetadata({
    title: seo.landing.title,
    description: seo.landing.description,
    path: '/mock-test-online/register',
  });

  return {
    ...base,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : base.alternates,
    openGraph: {
      ...base.openGraph,
      url: canonicalUrl || base.openGraph?.url,
      images: [{ url: ogImage, width: 600, height: 150, alt: 'Ebest English' }],
    },
    twitter: {
      ...base.twitter,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/** Metadata widget embed (exam, waiting, verify…) — noindex + canonical về landing. */
export function buildMockTestOnlineEmbedMetadata(
  seo: MockTestOnlineSeoConfig,
  path: string,
): Metadata {
  const canonicalUrl = resolveCanonical(seo);
  return buildEmbedPageMetadata({
    title: seo.embed.title,
    description: seo.embed.description,
    path,
    canonicalUrl: canonicalUrl || `${getSiteUrl()}${path}`,
  });
}

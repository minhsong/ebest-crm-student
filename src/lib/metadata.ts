import type { Metadata } from 'next';
import { APP_BRAND } from './ui-constants';

/** Site URL cho metadataBase (OG image absolute URL). Ưu tiên SITE_URL, sau đó NEXT_PUBLIC_APP_URL. */
export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    '';
  return url ? url.replace(/\/$/, '') : '';
}

const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
const DEFAULT_TITLE = `${APP_BRAND} – Cổng học viên`;
const DEFAULT_DESCRIPTION =
  'Cổng học viên Ebest English – Hoàn thiện thông tin, xem lịch học, điểm danh và hóa đơn. The best home for English lovers.';

export const defaultMetadata: Metadata = {
  metadataBase: getSiteUrl() ? new URL(getSiteUrl()) : undefined,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${APP_BRAND}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: APP_BRAND,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 600,
        height: 150,
        alt: 'Ebest English – The best home for English lovers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favi-logo.png',
  },
};

export function buildPageMetadata({
  title,
  description,
  path = '',
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const base = getSiteUrl();
  const url = base && path ? `${base}${path}` : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          width: 600,
          height: 150,
          alt: 'Ebest English',
        },
      ],
    },
    twitter: {
      title,
      description,
    },
  };
}

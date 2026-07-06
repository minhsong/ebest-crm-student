'use client';

import Link from 'next/link';
import type { PortalSiteLinks } from '@/lib/portal-course-catalog/types';

type Props = {
  siteLinks: PortalSiteLinks | null;
};

/** Strip CTA — khóa học nội bộ + link ngoài (about, Zalo, Messenger). */
export function LeadMarketingStrip({ siteLinks }: Props) {
  if (!siteLinks) return null;

  const items = [
    { href: '/lead/courses', label: 'Khóa học', external: false },
    { href: siteLinks.aboutUrl, label: 'Về Ebest', external: true },
    siteLinks.zaloChatUrl
      ? { href: siteLinks.zaloChatUrl, label: 'Tư vấn Zalo', external: true }
      : null,
    siteLinks.facebookMessengerUrl
      ? { href: siteLinks.facebookMessengerUrl, label: 'Messenger', external: true }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; external: boolean }>;

  if (items.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-sm">
      <span className="font-medium text-blue-900">Khám phá Ebest:</span>
      {items.map((item) =>
        item.external ? (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline-offset-2 hover:underline"
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="text-blue-700 underline-offset-2 hover:underline"
          >
            {item.label}
          </Link>
        ),
      )}
    </div>
  );
}

'use client';

import { Button } from 'antd';
import type { PortalSiteLinks } from '@/lib/portal-course-catalog/types';

type Props = {
  siteLinks: PortalSiteLinks | null;
  title?: string;
  className?: string;
};

/** CTA tư vấn Zalo + Messenger — dùng courses, kết quả thi, v.v. */
export function LeadConsultCta({
  siteLinks,
  title = 'Cần tư vấn lộ trình học?',
  className = 'mt-8 rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3',
}: Props) {
  if (!siteLinks?.zaloChatUrl && !siteLinks?.facebookMessengerUrl) {
    return null;
  }

  return (
    <div className={className}>
      <p className="mb-2 font-medium text-gray-900">{title}</p>
      <div className="flex flex-wrap gap-2">
        {siteLinks.zaloChatUrl ? (
          <Button
            type="primary"
            href={siteLinks.zaloChatUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tư vấn qua Zalo
          </Button>
        ) : null}
        {siteLinks.facebookMessengerUrl ? (
          <Button
            href={siteLinks.facebookMessengerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Nhắn Messenger
          </Button>
        ) : null}
      </div>
    </div>
  );
}

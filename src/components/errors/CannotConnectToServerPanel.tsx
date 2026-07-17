'use client';

import { Button, Result } from 'antd';
import {
  APP_BRAND,
  EBEST_BRAND_ORANGE,
  MESSENGER_CHAT_URL,
  ZALO_OA_CHAT_URL,
} from '@/lib/ui-constants';
import { PORTAL_SERVER_UNAVAILABLE_COPY } from '@/lib/student-safe-errors';

type Props = {
  /** Callback «Thử lại» — error.tsx dùng `reset`, global/layout dùng reload. */
  onRetry?: () => void;
  title?: string;
  description?: string;
  showHomeLink?: boolean;
};

/**
 * Màn lỗi thân thiện khi Portal không kết nối được CRM/Gateway.
 * Dùng URL fallback tĩnh — hoạt động cả khi chưa mount PortalContactLinksProvider.
 */
export function CannotConnectToServerPanel({
  onRetry,
  title = PORTAL_SERVER_UNAVAILABLE_COPY.title,
  description = PORTAL_SERVER_UNAVAILABLE_COPY.description,
  showHomeLink = true,
}: Props) {
  const handleRetry =
    onRetry ??
    (() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-10">
      <Result
        status="warning"
        title={title}
        subTitle={
          <div className="space-y-2 text-left text-neutral-600">
            <p>{description}</p>
            <p>{PORTAL_SERVER_UNAVAILABLE_COPY.supportHint}</p>
          </div>
        }
        extra={
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="primary" onClick={handleRetry}>
                Thử lại
              </Button>
              {showHomeLink ? (
                <Button href="/">Về trang chủ</Button>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                href={MESSENGER_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderColor: EBEST_BRAND_ORANGE, color: EBEST_BRAND_ORANGE }}
              >
                Nhắn Fanpage
              </Button>
              <Button
                href={ZALO_OA_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Hỗ trợ Zalo
              </Button>
            </div>
            <p className="text-center text-xs text-neutral-500">
              {APP_BRAND} — cảm ơn bạn đã kiên nhẫn.
            </p>
          </div>
        }
      />
    </div>
  );
}

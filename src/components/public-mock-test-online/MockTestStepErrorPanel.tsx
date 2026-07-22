'use client';

import Link from 'next/link';
import { Button, Result } from 'antd';
import {
  APP_BRAND,
  EBEST_BRAND_ORANGE,
  MESSENGER_CHAT_URL,
  ZALO_OA_CHAT_URL,
} from '@/lib/ui-constants';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { getMockTestOnlineRecoveryHref } from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';

export type MockTestStepErrorVariant =
  | 'funnel'
  | 'exam'
  | 'portal'
  | 'generic';

type Props = {
  title?: string;
  description?: string;
  variant?: MockTestStepErrorVariant;
  onRetry?: () => void;
  /** Chi tiết kỹ thuật — chỉ hiện khi dev. */
  digest?: string;
};

const COPY: Record<
  MockTestStepErrorVariant,
  { title: string; description: string }
> = {
  funnel: {
    title: 'Không tiếp tục được bước đăng ký thi thử',
    description:
      'Đã xảy ra lỗi khi tải hoặc xử lý bước này. Bạn có thể thử lại, bắt đầu lại từ đầu, hoặc liên hệ Ebest nếu lỗi lặp lại.',
  },
  exam: {
    title: 'Không mở / tiếp tục được bài thi',
    description:
      'Phiên làm bài gặp sự cố. Thử tải lại trang. Nếu vẫn lỗi, quay lại đăng ký hoặc mở lịch sử thi để tiếp tục bài đang làm dở.',
  },
  portal: {
    title: 'Không tải được trang thi thử',
    description:
      'Có lỗi khi hiển thị khu vực thi thử trên cổng học viên. Vui lòng thử lại hoặc quay về trang Thi thử.',
  },
  generic: {
    title: 'Đã xảy ra sự cố',
    description:
      'Không thể hiển thị nội dung lúc này. Vui lòng thử lại sau ít phút.',
  },
};

/**
 * Panel lỗi thân thiện cho funnel / exam / portal mock-test.
 * Dùng trong error.tsx segment và client ErrorBoundary.
 */
export function MockTestStepErrorPanel({
  title,
  description,
  variant = 'generic',
  onRetry,
  digest,
}: Props) {
  const copy = COPY[variant];
  const handleRetry =
    onRetry ??
    (() => {
      if (typeof window !== 'undefined') window.location.reload();
    });

  const restartHref = getMockTestOnlineRecoveryHref();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-10">
      <Result
        status="error"
        title={title ?? copy.title}
        subTitle={
          <div className="space-y-2 text-left text-neutral-600">
            <p>{description ?? copy.description}</p>
            {digest && process.env.NODE_ENV !== 'production' ? (
              <p className="break-all font-mono text-xs text-neutral-400">
                digest: {digest}
              </p>
            ) : null}
          </div>
        }
        extra={
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="primary" onClick={handleRetry}>
                Thử lại
              </Button>
              {variant === 'funnel' || variant === 'exam' ? (
                <Link href={restartHref}>
                  <Button>Bắt đầu lại đăng ký</Button>
                </Link>
              ) : null}
              {variant === 'exam' ? (
                <Link href={PORTAL_MOCK_TEST_ROUTES.results}>
                  <Button>Lịch sử thi</Button>
                </Link>
              ) : null}
              {variant === 'portal' ? (
                <Link href={PORTAL_MOCK_TEST_ROUTES.hub}>
                  <Button>Về trang Thi thử</Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button>Về trang chủ</Button>
                </Link>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                href={MESSENGER_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderColor: EBEST_BRAND_ORANGE,
                  color: EBEST_BRAND_ORANGE,
                }}
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

'use client';

import Link from 'next/link';
import { Alert, Steps, Typography } from 'antd';
import type { LeadSessionProbe } from '@/lib/lead-portal/types';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';

const { Paragraph, Text } = Typography;

type Props = {
  probe: LeadSessionProbe | null;
};

export function MockTestOnlinePortalAccessGuide({ probe }: Props) {
  const sessionKind = probe?.kind ?? null;

  if (sessionKind === 'lead' || sessionKind === 'student') {
    const resultsHref =
      sessionKind === 'student'
        ? PORTAL_MOCK_TEST_RESULTS_ROUTES.student
        : PORTAL_MOCK_TEST_RESULTS_ROUTES.lead;
    return (
      <Alert
        type="success"
        showIcon
        className="mock-test-online-portal-guide"
        message="Bạn đã đăng nhập cổng học viên"
        description={
          <Paragraph className="!mb-0">
            Khi có điểm, vào{' '}
            <Link href={resultsHref}>Kết quả thi thử</Link> để xem chi tiết. Thông
            tin đăng nhập cũng được gửi qua Zalo OA và email (nếu bạn chọn nhận
            email).
          </Paragraph>
        }
      />
    );
  }

  return (
    <div className="mock-test-online-portal-guide">
      <Text strong className="mock-test-online-portal-guide-title">
        Xem điểm trên cổng học viên Ebest
      </Text>
      <Steps
        direction="vertical"
        size="small"
        current={-1}
        className="mock-test-online-portal-guide-steps"
        items={[
          {
            title: 'Chờ chấm điểm',
            description:
              'Hệ thống đang xử lý bài làm. Kết quả sẽ gửi qua Zalo OA Ebest và email (nếu bạn đã chọn).',
          },
          {
            title: 'Nhận thông tin đăng nhập',
            description:
              'Tin Zalo / email sẽ kèm link đăng nhập, tài khoản (SĐT hoặc email đăng ký) và mật khẩu tạm (nếu chưa có tài khoản).',
          },
          {
            title: 'Đăng nhập và xem điểm',
            description: (
              <>
                Truy cập{' '}
                <Link href={PORTAL_MOCK_TEST_RESULTS_ROUTES.login}>
                  trang đăng nhập cổng học viên
                </Link>
                , đăng nhập bằng SĐT/email và mật khẩu (hoặc mật khẩu tạm trong
                Zalo/email), rồi mở mục <Text strong>Kết quả thi thử</Text>.
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Alert, Steps, Typography } from 'antd';
import type { LeadSessionProbe } from '@/lib/lead-portal/types';
import {
  isLeadCompleteProfileHref,
  PORTAL_MOCK_TEST_RESULTS_ROUTES,
} from '@/lib/portal-auth/session-routes';

const { Paragraph, Text } = Typography;

type Props = {
  probe: LeadSessionProbe | null;
  /** Đích sau thi (server) — dùng để phân nhánh incomplete Lead. */
  nextPath?: string | null;
};

function isLoggedInProbe(kind: LeadSessionProbe['kind'] | null): boolean {
  return kind === 'lead' || kind === 'customer';
}

export function MockTestOnlinePortalAccessGuide({ probe, nextPath }: Props) {
  const sessionKind = probe?.kind ?? null;
  const needsCompleteProfile =
    sessionKind === 'lead' && isLeadCompleteProfileHref(nextPath);

  if (needsCompleteProfile) {
    return (
      <Alert
        type="warning"
        showIcon
        className="mock-test-online-portal-guide"
        message="Hoàn thiện tài khoản để xem điểm"
        description={
          <Paragraph className="!mb-0">
            Bạn đã có phiên đăng nhập Lead. Hãy{' '}
            <Link href={nextPath ?? '/lead/complete-profile'}>
              hoàn thiện hồ sơ và tạo mật khẩu
            </Link>{' '}
            để mở đầy đủ menu cổng Ebest và xem kết quả khi bài đã chấm xong.
            Thông tin đăng nhập cũng được nhắc qua Zalo OA / email (nếu bạn chọn
            nhận email).
          </Paragraph>
        }
      />
    );
  }

  if (isLoggedInProbe(sessionKind)) {
    const resultsHref = PORTAL_MOCK_TEST_RESULTS_ROUTES.lead;
    return (
      <Alert
        type="success"
        showIcon
        className="mock-test-online-portal-guide"
        message="Bạn đã đăng nhập cổng học viên"
        description={
          <Paragraph className="!mb-0">
            Khi có điểm, vào <Link href={resultsHref}>Kết quả thi thử</Link> để
            xem chi tiết. Thông tin đăng nhập cũng được gửi qua Zalo OA và email
            (nếu bạn chọn nhận email).
          </Paragraph>
        }
      />
    );
  }

  return (
    <Alert
      type="info"
      showIcon
      className="mock-test-online-portal-guide"
      message="Xem điểm trên cổng học viên Ebest"
      description={
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          className="mock-test-online-portal-guide-steps !mt-2"
          items={[
            {
              title: 'Chờ chấm điểm',
              description:
                'Hệ thống đang xử lý bài làm. Kết quả sẽ gửi qua Zalo OA Ebest và email (nếu bạn đã chọn).',
            },
            {
              title: 'Nhận thông tin đăng nhập',
              description:
                'Tin Zalo / email sẽ kèm link đăng nhập, tài khoản (SĐT hoặc email đăng ký) và mật khẩu (sau khi bạn hoàn thiện hồ sơ hoặc mật khẩu tạm nếu tài khoản mới được tạo khi gửi kết quả).',
            },
            {
              title: 'Đăng nhập và xem điểm',
              description: (
                <>
                  Truy cập{' '}
                  <Link href={PORTAL_MOCK_TEST_RESULTS_ROUTES.login}>
                    trang đăng nhập cổng học viên
                  </Link>
                  , đăng nhập bằng SĐT/email và mật khẩu, rồi mở mục{' '}
                  <Text strong>Kết quả thi thử</Text>.
                </>
              ),
            },
          ]}
        />
      }
    />
  );
}

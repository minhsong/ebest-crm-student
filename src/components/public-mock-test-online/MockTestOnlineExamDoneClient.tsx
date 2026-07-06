'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Result, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlinePortalAccessGuide } from '@/components/public-mock-test-online/MockTestOnlinePortalAccessGuide';
import { useProbeLeadSession } from '@/features/mock-test-portal/hooks/useProbeLeadSession';
import { resolveMockTestResultsPath, PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';
import { fetchExamFunnelHint } from '@/lib/complete-profile/check-login-key';
import { loadMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-session';

const { Paragraph } = Typography;

export function MockTestOnlineExamDoneClient() {
  const probe = useProbeLeadSession();
  const sessionKind = probe?.kind ?? null;
  const [hideLeadRegister, setHideLeadRegister] = useState(false);

  useEffect(() => {
    const auth = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
    const registrationId = auth?.registrationId;
    if (!registrationId) return;
    void fetchExamFunnelHint(registrationId).then((hint) => {
      setHideLeadRegister(hint.hideLeadRegister);
    });
  }, []);

  const resultsHref = resolveMockTestResultsPath(probe ?? { kind: 'none' });
  const resultsLabel =
    sessionKind === 'student' || sessionKind === 'lead'
      ? 'Xem kết quả trên cổng HV'
      : 'Đăng nhập xem kết quả';

  const showLeadRegisterCta =
    sessionKind === 'none' && !hideLeadRegister;

  return (
    <MockTestOnlineFunnelShell step="exam">
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="Đã nộp bài thành công"
        subTitle="Cảm ơn bạn đã hoàn thành bài thi thử. Kết quả và hướng dẫn đăng nhập cổng học viên sẽ được gửi qua Zalo OA Ebest và email (nếu bạn đã chọn nhận qua email)."
        extra={[
          <Link key="results" href={resultsHref}>
            <Button type="primary" size="large" loading={probe === null}>
              {resultsLabel}
            </Button>
          </Link>,
          <Link key="register" href="/mock-test-online/register">
            <Button size="large">Đăng ký thi thử khác</Button>
          </Link>,
        ]}
      />
      <MockTestOnlinePortalAccessGuide probe={probe} />
      {showLeadRegisterCta ? (
        <Paragraph type="secondary" className="text-center text-sm !mb-0 !mt-4">
          Chưa có tài khoản?{' '}
          <Link href="/lead/register">Đăng ký tài khoản lead</Link> để theo dõi kết
          quả sau này.
        </Paragraph>
      ) : null}
      {sessionKind === 'none' && hideLeadRegister ? (
        <Paragraph type="secondary" className="text-center text-sm !mb-0 !mt-4">
          Email/SĐT đăng ký đã có trên cổng học viên.{' '}
          <Link href={PORTAL_MOCK_TEST_RESULTS_ROUTES.login}>Đăng nhập</Link> để
          theo dõi kết quả.
        </Paragraph>
      ) : null}
    </MockTestOnlineFunnelShell>
  );
}

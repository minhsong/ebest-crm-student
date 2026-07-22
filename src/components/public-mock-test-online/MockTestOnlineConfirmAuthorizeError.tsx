'use client';

import { Alert, Button, Space, Typography } from 'antd';
import { buildLeadCompleteProfilePath } from '@/lib/portal-auth/session-routes';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import type { MockTestOnlineErrorCopy } from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';

const { Paragraph } = Typography;

type Props = {
  error: MockTestOnlineErrorCopy;
  canProceedAfterZalo: boolean;
  onClear: () => void;
  onRetryContinue: () => void;
};

/** Panel lỗi authorize — Ant Design Alert + recovery actions. */
export function MockTestOnlineConfirmAuthorizeError({
  error,
  canProceedAfterZalo,
  onClear,
  onRetryContinue,
}: Props) {
  const recovery = error.recovery;

  return (
    <Alert
      type="error"
      showIcon
      className="!mb-4"
      message={error.title}
      description={
        <Space direction="vertical" size="middle" className="w-full">
          <Paragraph className="!mb-0">{error.description}</Paragraph>
          <Space wrap>
            {recovery === 'lead_tests' ? (
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    window.location.assign(
                      buildLeadCompleteProfilePath(
                        PORTAL_MOCK_TEST_ROUTES.results,
                      ),
                    );
                  }}
                >
                  Xem lịch sử thi
                </Button>
                <Button
                  onClick={() => {
                    window.location.assign('/mock-test-online/register');
                  }}
                >
                  Đăng ký lại
                </Button>
              </>
            ) : null}
            {recovery === 'restart' ? (
              <Button
                type="primary"
                onClick={() => {
                  window.location.assign('/mock-test-online/register');
                }}
              >
                Bắt đầu lại
              </Button>
            ) : null}
            {recovery === 'login' ? (
              <Button
                type="primary"
                onClick={() => {
                  window.location.assign('/login');
                }}
              >
                Đăng nhập
              </Button>
            ) : null}
            {recovery === 'retry' || !recovery || recovery === 'none' ? (
              <Button
                type="primary"
                onClick={() => {
                  onClear();
                  if (canProceedAfterZalo) onRetryContinue();
                }}
              >
                Thử lại
              </Button>
            ) : null}
          </Space>
        </Space>
      }
    />
  );
}

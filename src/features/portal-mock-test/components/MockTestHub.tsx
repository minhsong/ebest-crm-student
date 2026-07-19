'use client';

import Link from 'next/link';
import { Card, Col, Row, Tag, Typography } from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  FormOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { PageCard, PageHeader } from '@/components/layout';
import { resolveMockTestHubAccess } from '@/features/portal-mock-test/adapters/route-hrefs';
import type { PortalMockTestPrincipal } from '@/features/portal-mock-test/identity/types';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { resolveMockTestHubOnlineState } from '@/features/portal-mock-test/hub-online-status';

const { Paragraph, Text } = Typography;

type Props = {
  principal: PortalMockTestPrincipal;
  attemptStatus?: MockTestOnlineAttemptStatus | null;
};

export function MockTestHub({ principal, attemptStatus = null }: Props) {
  const access = resolveMockTestHubAccess(principal);
  const onlineState = resolveMockTestHubOnlineState(attemptStatus);
  const onlineHref =
    onlineState.kind === 'resume' || onlineState.kind === 'blocked'
      ? PORTAL_MOCK_TEST_ROUTES.results
      : access.onlineHref;
  const onlineCta =
    onlineState.kind === 'resume'
      ? 'Tiếp tục bài đang làm'
      : onlineState.kind === 'blocked'
        ? 'Xem kết quả và tư vấn'
        : access.canUse
          ? 'Bắt đầu thi online'
          : 'Đăng nhập để thi';

  return (
    <>
      <PageHeader
        title="Thi thử"
        description="Chọn hình thức phù hợp để kiểm tra năng lực, làm quen với kỳ thi và theo dõi quá trình tiến bộ của bạn."
      />
      {access.needsProfileCompletion ? (
        <PageCard className="mb-4">
          <Text type="warning">
            Bạn có thể thi online ngay. Vui lòng{' '}
            <Link href="/lead/complete-profile">hoàn thiện hồ sơ</Link> để xem
            kết quả và đăng ký thi tại trung tâm.
          </Text>
        </PageCard>
      ) : null}
      {principal.actor === 'guest' ? (
        <PageCard className="mb-4">
          <Paragraph className="!mb-0 text-gray-600">
            Đăng nhập để đăng ký thi và xem kết quả.
          </Paragraph>
        </PageCard>
      ) : null}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Link
            href={onlineHref}
            aria-label={onlineCta}
            className="block h-full rounded-lg no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Card
              hoverable
              className="h-full cursor-pointer [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-[190px] [&_.ant-card-body]:flex-col"
              title={
                <span>
                  <PlayCircleOutlined className="mr-2 text-blue-500" />
                  Thi thử online
                </span>
              }
            >
              <Paragraph className="!mb-4 !text-neutral-900">
                Trải nghiệm bài thi mô phỏng ngay tại nhà, kiểm tra năng lực
                hiện tại và chủ động chuẩn bị tốt hơn cho kỳ thi thật.
              </Paragraph>
              {onlineState.kind !== 'unknown' ? (
                <div className="mb-3">
                  <Tag
                    color={
                      onlineState.kind === 'available'
                        ? 'green'
                        : onlineState.kind === 'resume'
                          ? 'processing'
                          : 'red'
                    }
                  >
                    {onlineState.label}
                  </Tag>
                </div>
              ) : null}
              <span className="mt-auto font-medium text-blue-600">
                {onlineCta}
                <ArrowRightOutlined className="ml-2" />
              </span>
            </Card>
          </Link>
        </Col>
        <Col xs={24} md={8}>
          <Link
            href={access.offlineHref}
            aria-label={
              access.canUse ? 'Đăng ký thi tại trung tâm' : 'Đăng nhập để đăng ký'
            }
            className="block h-full rounded-lg no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Card
              hoverable
              className="h-full cursor-pointer [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-[190px] [&_.ant-card-body]:flex-col"
              title={
                <span>
                  <CalendarOutlined className="mr-2 text-green-600" />
                  Thi thử tại trung tâm
                </span>
              }
            >
              <Paragraph className="!mb-4 !text-neutral-900">
                Làm bài trực tiếp trong môi trường thi nghiêm túc, làm quen
                với áp lực thời gian và được Ebest hỗ trợ trong suốt buổi thi.
              </Paragraph>
              <span className="mt-auto font-medium text-blue-600">
                {access.canUse
                  ? 'Chọn buổi thi phù hợp'
                  : 'Đăng nhập để đăng ký'}
                <ArrowRightOutlined className="ml-2" />
              </span>
            </Card>
          </Link>
        </Col>
        <Col xs={24} md={8}>
          <Link
            href={access.resultsHref}
            aria-label={access.canUse ? 'Xem kết quả thi' : 'Đăng nhập để xem'}
            className="block h-full rounded-lg no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Card
              hoverable
              className="h-full cursor-pointer [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-[190px] [&_.ant-card-body]:flex-col"
              title={
                <span>
                  <FormOutlined className="mr-2 text-violet-600" />
                  Kết quả thi
                </span>
              }
            >
              <Paragraph className="!mb-4 !text-neutral-900">
                Xem lại điểm số và lịch sử các lần thi để theo dõi tiến bộ,
                nhận biết mục tiêu tiếp theo và lên kế hoạch học tập phù hợp.
              </Paragraph>
              <span className="mt-auto font-medium text-blue-600">
                {access.canUse ? 'Xem kết quả' : 'Đăng nhập để xem'}
                <ArrowRightOutlined className="ml-2" />
              </span>
            </Card>
          </Link>
        </Col>
      </Row>
    </>
  );
}

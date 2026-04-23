'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Card,
  Col,
  Empty,
  Flex,
  Row,
  Space,
  Spin,
  Typography,
  theme,
} from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { PageHeader, PageCard } from '@/components/layout';
import { CRM_CLASS_STATUS } from '@/lib/crm-enums';
import { useDashboardHome } from '@/features/dashboard/hooks/useDashboardHome';
import { DASHBOARD_QUICK_LINKS } from '@/features/dashboard/dashboard.constants';
import { StudentWeekSchedule } from '@/features/dashboard/components/StudentWeekSchedule';
import { SessionCard } from '@/features/schedule/components/SessionCard';
import { StudentChecklistDetailModal, StudentPendingChecklistsCard } from '@/features/checklists';
import {
  countPastSessions,
  flattenSessionsWithClass,
  recentPastSessions,
} from '@/lib/dashboard-schedule-helpers';

const { Text, Title } = Typography;

export function DashboardHomeView() {
  const { token } = theme.useToken();
  const { loading, classes, sessionsByClass } = useDashboardHome();
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistId, setChecklistId] = useState<number | null>(null);

  const openChecklist = useCallback((id: number) => {
    setChecklistId(id);
    setChecklistOpen(true);
  }, []);

  const closeChecklist = useCallback(() => {
    setChecklistOpen(false);
    setChecklistId(null);
  }, []);

  const flatSessions = useMemo(
    () => flattenSessionsWithClass(sessionsByClass),
    [sessionsByClass],
  );

  const recentPast = useMemo(
    () => recentPastSessions(flatSessions, 5),
    [flatSessions],
  );

  const pastTotalCount = useMemo(
    () => countPastSessions(flatSessions),
    [flatSessions],
  );

  const upcomingClasses = useMemo(
    () =>
      classes.filter(
        (c) =>
          c.classStatus === CRM_CLASS_STATUS.PLANNING ||
          c.classStatus === CRM_CLASS_STATUS.READY,
      ),
    [classes],
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: '48px 0' }}>
        <Spin size="large" tip="Đang tải..." />
      </Flex>
    );
  }

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Lịch tuần này, buổi đã học gần đây và lối tắt tới các mục chính."
      />

      <StudentPendingChecklistsCard onOpenDetail={openChecklist} />

      {upcomingClasses.length > 0 && (
        <Space
          direction="vertical"
          size="middle"
          style={{ width: '100%', marginBottom: token.marginLG }}
        >
          {upcomingClasses.map((c) => (
            <Card key={c.classId} className="border-amber-200 bg-amber-50/50">
              <Alert
                type="info"
                showIcon
                icon={<CalendarOutlined />}
                message="Lớp sắp khai giảng"
                description={
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ marginTop: token.marginXS, width: '100%' }}
                  >
                    <Text strong style={{ fontSize: token.fontSize }}>
                      {c.className} ({c.classCode})
                    </Text>
                    <Text type="secondary">Khóa học: {c.courseName}</Text>
                    {c.startDate && (
                      <Text type="secondary">
                        Ngày dự kiến khai giảng:{' '}
                        <Text strong>
                          {new Date(c.startDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </Text>
                    )}
                    <Text type="secondary" style={{ marginTop: token.marginXXS }}>
                      Lớp của bạn sắp được mở, hãy vui lòng đợi.
                    </Text>
                  </Space>
                }
              />
            </Card>
          ))}
        </Space>
      )}

      {classes.length > 0 && (
        <div style={{ marginBottom: token.marginXL }}>
          <StudentWeekSchedule sessionsByClass={sessionsByClass} />
        </div>
      )}

      {classes.length > 0 && (
        <div style={{ marginBottom: token.marginXL }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={8} style={{ marginBottom: token.marginSM }}>
            <Title level={5} style={{ margin: 0 }}>
              Buổi đã học
            </Title>
            {pastTotalCount > 5 ? (
              <Link href="/schedule" style={{ color: token.colorLink, fontSize: token.fontSize }}>
                Xem thêm trên Lịch học
              </Link>
            ) : null}
          </Flex>
          {recentPast.length === 0 ? (
            <Empty
              description="Chưa có buổi đã kết thúc."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {recentPast.map((m, i) => (
                <SessionCard
                  key={`${m.classId}-${m.row.sessionId}`}
                  row={m.row}
                  stripedDim={i % 2 === 0}
                  classContextLabel={`${m.className} (${m.classCode})`}
                />
              ))}
            </Space>
          )}
        </div>
      )}

      {classes.length === 0 && (
        <Card style={{ marginBottom: token.marginLG }}>
          <Text type="secondary">
            Bạn chưa có lớp nào. Liên hệ trung tâm để được xếp lớp.
          </Text>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {DASHBOARD_QUICK_LINKS.map((item) => (
          <Col key={item.href} xs={24} sm={12}>
            <Link href={item.href} style={{ display: 'block' }}>
              <PageCard className="transition-shadow hover:shadow-md">
                <Flex align="center" gap={12}>
                  <div className={`rounded-lg p-3 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div>
                    <Text strong style={{ display: 'block' }}>
                      {item.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {item.description}
                    </Text>
                  </div>
                </Flex>
              </PageCard>
            </Link>
          </Col>
        ))}
      </Row>

      <StudentChecklistDetailModal
        open={checklistOpen}
        checklistId={checklistId}
        onClose={closeChecklist}
      />
    </>
  );
}

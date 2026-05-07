'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card, Empty, Flex, Spin, Space, Typography, theme } from 'antd';
import type { OverviewClassSessions } from '@/types/overview-sessions';
import { StudentWeekSchedule } from '@/features/dashboard/components/StudentWeekSchedule';
import { SessionCard } from '@/features/schedule/components/SessionCard';
import {
  flattenSessionsWithClass,
  recentPastSessions,
} from '@/lib/dashboard-schedule-helpers';

const { Text, Title } = Typography;

/**
 * Tab "Các buổi học" trên trang chi tiết lớp:
 * - Sử dụng nguyên `StudentWeekSchedule` (giống dashboard) cho lịch tuần này.
 * - Section "Buổi đã học" tái sử dụng nguyên `SessionCard` (giống dashboard),
 *   khác duy nhất: liệt kê **tất cả** buổi đã kết thúc của lớp (dashboard chỉ hiện 5).
 */
export function ClassSessionsTab(props: {
  loading: boolean;
  overview: OverviewClassSessions | null;
}) {
  const { token } = theme.useToken();
  const { loading, overview } = props;

  const sessionsByClass = useMemo(
    () => (overview ? [overview] : []),
    [overview],
  );

  const flatSessions = useMemo(
    () => flattenSessionsWithClass(sessionsByClass),
    [sessionsByClass],
  );

  const allPast = useMemo(
    () => recentPastSessions(flatSessions, Number.MAX_SAFE_INTEGER),
    [flatSessions],
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: '48px 0' }}>
        <Spin tip="Đang tải..." />
      </Flex>
    );
  }

  if (!overview) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không tìm thấy lớp hoặc bạn chưa được gán lớp này."
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <StudentWeekSchedule sessionsByClass={sessionsByClass} />

      <div>
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          gap={8}
          style={{ marginBottom: token.marginSM }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Buổi đã học
          </Title>
          <Link
            href="/schedule"
            style={{ color: token.colorLink, fontSize: token.fontSize }}
          >
            Mở Lịch học
          </Link>
        </Flex>
        {allPast.length === 0 ? (
          <Empty
            description={
              <Text type="secondary">Chưa có buổi đã kết thúc.</Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {allPast.map((m, i) => (
              <SessionCard
                key={`${m.classId}-${m.row.sessionId}`}
                row={m.row}
                stripedDim={i % 2 === 0}
                classCode={m.classCode}
              />
            ))}
          </Space>
        )}
      </div>
    </Space>
  );
}

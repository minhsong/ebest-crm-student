'use client';

import { Card, Empty, Flex, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { OverviewSessionRow } from '@/types/overview-sessions';
import { AttendanceCell } from '@/features/dashboard/components/AttendanceCell';

export function ClassAttendanceTab(props: {
  loading: boolean;
  sessions: OverviewSessionRow[];
}) {
  const { loading, sessions } = props;

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: '48px 0' }}>
        <Spin tip="Đang tải..." />
      </Flex>
    );
  }

  if (!sessions.length) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có dữ liệu điểm danh."
        />
      </Card>
    );
  }

  const columns: ColumnsType<OverviewSessionRow> = [
    {
      title: 'Ngày',
      key: 'date',
      width: 140,
      render: (_: unknown, row: OverviewSessionRow) =>
        new Date(row.scheduledDate).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Buổi học',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      key: 'attendance',
      width: 200,
      render: (_: unknown, row: OverviewSessionRow) => (
        <AttendanceCell status={row.attendanceStatus} label={row.attendanceLabel} />
      ),
    },
  ];

  return (
    <Table
      dataSource={sessions}
      rowKey="sessionId"
      pagination={false}
      columns={columns}
    />
  );
}


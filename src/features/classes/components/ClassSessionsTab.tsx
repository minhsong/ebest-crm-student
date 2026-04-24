'use client';

import { Card, Empty, Flex, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { OverviewSessionRow } from '@/types/overview-sessions';

export function ClassSessionsTab(props: {
  loading: boolean;
  sessions: OverviewSessionRow[];
  columns: ColumnsType<OverviewSessionRow>;
}) {
  const { loading, sessions, columns } = props;

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
          description="Chưa có buổi học nào."
        />
      </Card>
    );
  }

  return (
    <Table
      dataSource={sessions}
      columns={columns}
      rowKey="sessionId"
      pagination={false}
    />
  );
}


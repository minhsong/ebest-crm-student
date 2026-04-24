'use client';

import { Card, Empty, Flex, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StudentClassAssignmentsRow } from '@/features/classes/types';

export function ClassAssignmentsTab(props: {
  loading: boolean;
  rows: StudentClassAssignmentsRow[];
  columns: ColumnsType<StudentClassAssignmentsRow>;
}) {
  const { loading, rows, columns } = props;

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: '48px 0' }}>
        <Spin tip="Đang tải..." />
      </Flex>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có bài tập nào."
        />
      </Card>
    );
  }

  return (
    <Table
      dataSource={rows}
      rowKey="assignmentId"
      pagination={false}
      columns={columns}
    />
  );
}


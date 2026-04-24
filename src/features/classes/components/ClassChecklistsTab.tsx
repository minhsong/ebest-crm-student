'use client';

import { Card, Empty, Flex, Segmented, Space, Spin, Typography } from 'antd';
import type { StudentChecklistListRow } from '@/types/student-checklists';
import type { ChecklistStatusFilter } from '@/features/classes/hooks/use-class-checklists';
import { StudentChecklistCardItem } from '@/features/checklists/components/StudentChecklistCardItem';

const { Text } = Typography;

export function ClassChecklistsTab(props: {
  loading: boolean;
  rows: StudentChecklistListRow[];
  status: ChecklistStatusFilter;
  onStatusChange: (v: ChecklistStatusFilter) => void;
  onOpenDetail: (checklistId: number) => void;
}) {
  const { loading, rows, status, onStatusChange, onOpenDetail } = props;

  return (
    <>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
        <Text strong>Checklist</Text>
        <Segmented
          value={status}
          onChange={(v) => onStatusChange(v as ChecklistStatusFilter)}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'Chưa xong', value: 'pending' },
            { label: 'Đã xong', value: 'done' },
          ]}
        />
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" style={{ padding: '48px 0' }}>
          <Spin tip="Đang tải..." />
        </Flex>
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có checklist nào."
          />
        </Card>
      ) : (
        <div>
          {rows.map((r: StudentChecklistListRow) => (
            <StudentChecklistCardItem
              key={`${r.checklistId}-${r.createdAt}`}
              row={r}
              onOpenDetail={onOpenDetail}
              hideClassCode
            />
          ))}
        </div>
      )}
    </>
  );
}


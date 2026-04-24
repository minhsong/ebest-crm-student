'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, Empty, Flex, List, Space, Typography, theme } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import type { StudentChecklistListRow } from '@/types/student-checklists';
import { StudentChecklistCardItem } from '@/features/checklists/components/StudentChecklistCardItem';

const { Text } = Typography;

type Props = {
  onOpenDetail: (checklistId: number) => void;
  limit?: number;
};

export function StudentPendingChecklistsCard({ onOpenDetail, limit = 8 }: Props) {
  const { token } = theme.useToken();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StudentChecklistListRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/checklists?limit=${limit}`);
      const data = await res.json().catch(() => []);
      setRows(res.ok && Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const count = rows.length;
  const title = useMemo(
    () => (
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Space size="small">
          <Text strong>Checklist cần thực hiện</Text>
          <Badge count={count} showZero={false} />
        </Space>
        <Link href="/classes" className="text-blue-600 hover:underline">
          Xem lớp học
        </Link>
      </Flex>
    ),
    [count],
  );

  return (
    <Card title={title} loading={loading} style={{ marginBottom: token.marginXL }}>
      {count === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Bạn không có checklist nào chưa hoàn thành."
        />
      ) : (
        <List
          dataSource={rows}
          split={false}
          renderItem={(row) => {
            return (
              <List.Item style={{ padding: 0 }}>
                <StudentChecklistCardItem row={row} onOpenDetail={onOpenDetail} />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}


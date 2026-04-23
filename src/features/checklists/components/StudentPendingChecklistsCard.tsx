'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, Empty, Flex, List, Space, Typography, theme } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import type { StudentChecklistListRow } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';

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
          renderItem={(row) => {
            const classLabel = row.className
              ? `${row.className} (${row.classCode || '—'})`
              : row.classCode || 'Lớp học';
            return (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="link"
                    icon={<RightOutlined />}
                    onClick={() => onOpenDetail(row.checklistId)}
                  >
                    Xem
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space direction="vertical" size={0}>
                      <Text strong>{row.title || checklistTypeLabel(row.typeKey)}</Text>
                      <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                        {classLabel}
                      </Text>
                    </Space>
                  }
                  description={
                    <Space size="small" wrap>
                      <Text type="secondary">{checklistTypeLabel(row.typeKey)}</Text>
                      {row.deadlineAt ? (
                        <Text type="secondary">
                          Deadline: {new Date(row.deadlineAt).toLocaleString('vi-VN')}
                        </Text>
                      ) : null}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}


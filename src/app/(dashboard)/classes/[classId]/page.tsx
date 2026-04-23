'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Card, Empty, Flex, Segmented, Space, Spin, Table, Typography, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader, PageCard } from '@/components/layout';
import { useAuth } from '@/contexts/auth-context';
import type { StudentChecklistListRow } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';
import { StudentChecklistDetailModal } from '@/features/checklists';

const { Text } = Typography;

type StatusFilter = 'all' | 'pending' | 'done';

export default function StudentClassDetailPage() {
  const { token } = theme.useToken();
  const params = useParams<{ classId: string }>();
  const { fetchWithAuth } = useAuth();
  const classId = Number.parseInt(params.classId, 10);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StudentChecklistListRow[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const openDetail = useCallback((id: number) => {
    setDetailId(id);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailId(null);
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(classId) || classId < 1) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/classes/${classId}/checklists?status=${status}`);
      const data = await res.json().catch(() => []);
      setRows(res.ok && Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, classId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const classLabel = useMemo(() => {
    const first = rows[0];
    if (!first) return `Lớp #${classId}`;
    return `${first.className || `Lớp #${classId}`} (${first.classCode || '—'})`;
  }, [rows, classId]);

  const columns = useMemo(() => {
    return [
      {
        title: 'Checklist',
        key: 'title',
        render: (_: unknown, r: StudentChecklistListRow) => (
          <Space direction="vertical" size={0}>
            <Text strong>{r.title || checklistTypeLabel(r.typeKey)}</Text>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {checklistTypeLabel(r.typeKey)}
              {r.deadlineAt ? ` · Deadline: ${new Date(r.deadlineAt).toLocaleString('vi-VN')}` : ''}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'checked',
        key: 'checked',
        width: 140,
        render: (v: boolean) => (
          <Text type={v ? 'success' : 'warning'}>
            {v ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
          </Text>
        ),
      },
      {
        title: '',
        key: 'actions',
        width: 120,
        render: (_: unknown, r: StudentChecklistListRow) => (
          <Button type="link" onClick={() => openDetail(r.checklistId)}>
            Xem
          </Button>
        ),
      },
    ];
  }, [openDetail, token.fontSizeSM]);

  return (
    <>
      <PageHeader
        title={classLabel}
        description="Checklist của bạn trong lớp học này (chỉ hiển thị các checklist có tên bạn)."
        leading={
          <Link href="/classes">
            <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
          </Link>
        }
      />

      <PageCard>
        <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: token.marginSM }}>
          <Text strong>Checklist</Text>
          <Segmented
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
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
          <Table
            dataSource={rows}
            columns={columns}
            rowKey={(r) => `${r.checklistId}-${r.createdAt}`}
            pagination={false}
          />
        )}
      </PageCard>

      <StudentChecklistDetailModal
        open={detailOpen}
        checklistId={detailId}
        onClose={closeDetail}
      />
    </>
  );
}


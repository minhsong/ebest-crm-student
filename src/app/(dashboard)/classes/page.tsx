'use client';

import { useCallback, useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader, PageCard, LoadingState } from '@/components/layout';

interface ClassItem {
  enrollmentId: number;
  classId: number;
  className: string;
  classCode: string;
  courseName: string;
  enrollmentDate?: string;
  schedule?: Array<{ dayCode: number; time: string }>;
}

const DAY_LABELS: Record<number, string> = {
  0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7',
};

export default function MyClassesPage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ClassItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/classes');
      const data = await res.json().catch(() => ({}));
      setList(res.ok && Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: 'Mã lớp', dataIndex: 'classCode', key: 'classCode', width: 120 },
    { title: 'Tên lớp', dataIndex: 'className', key: 'className' },
    { title: 'Khóa học', dataIndex: 'courseName', key: 'courseName' },
    { title: 'Ngày ghi danh', dataIndex: 'enrollmentDate', key: 'enrollmentDate', width: 120, render: (v: string) => v || '—' },
    {
      title: 'Lịch học',
      key: 'schedule',
      render: (_: unknown, row: ClassItem) =>
        row.schedule?.length
          ? row.schedule.map((s) => (
              <Tag key={s.dayCode}>{DAY_LABELS[s.dayCode] ?? `T${s.dayCode + 1}`}: {s.time}</Tag>
            ))
          : '—',
    },
  ];

  return (
    <>
      <PageHeader
        title="Lớp học của tôi"
        description="Danh sách lớp bạn đang theo học."
      />
      <PageCard noPadding>
        <Table
          loading={loading}
          dataSource={list}
          columns={columns}
          rowKey="enrollmentId"
          pagination={false}
          locale={{ emptyText: 'Chưa có lớp nào.' }}
        />
      </PageCard>
    </>
  );
}

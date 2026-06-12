'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Tabs, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader, PageCard } from '@/components/layout';
import { LearningAccessNoticeInline } from '@/features/learning/components/LearningAccessNotice';
import { resolveReadOnlyNoticeMessage } from '@/features/learning/utils/learning-access';
import { useAuth } from '@/contexts/auth-context';
import { StudentChecklistDetailModal } from '@/features/checklists';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import type { OverviewSessionRow } from '@/types/overview-sessions';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import {
  ClassAssignmentsTab,
  ClassAttendanceTab,
  ClassChecklistsTab,
  ClassSessionsTab,
  ClassVocabularyTab,
  classDetailTitleFromOverview,
  type ChecklistStatusFilter,
  type StudentClassAssignmentsRow,
  type StudentClassDetailTabKey,
  useClassChecklists,
  useClassOverview,
} from '@/features/classes';

export default function StudentClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const { fetchWithAuth } = useAuth();
  const classId = Number.parseInt(params.classId, 10);

  const [tab, setTab] = useState<StudentClassDetailTabKey>('sessions');
  const [status, setStatus] = useState<ChecklistStatusFilter>('all');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState<number | null>(null);

  const openDetail = useCallback((id: number) => {
    setDetailId(id);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailId(null);
  }, []);

  const openAssignment = useCallback((id: number) => {
    setAssignmentId(id);
    setAssignmentOpen(true);
  }, []);

  const closeAssignment = useCallback(() => {
    setAssignmentOpen(false);
    setAssignmentId(null);
  }, []);

  const { loading: overviewLoading, overview, sessions } = useClassOverview({
    classId,
    fetchWithAuth,
  });

  const {
    loading: checklistsLoading,
    rows,
  } = useClassChecklists({
    classId,
    status,
    enabled: tab === 'checklists',
    fetchWithAuth,
  });

  const classLabel = useMemo(() => {
    return classDetailTitleFromOverview(classId, overview);
  }, [classId, overview]);

  const flattenedAssignments = useMemo(() => {
    const out: StudentClassAssignmentsRow[] = [];
    for (const s of sessions) {
      for (const a of s.assignments ?? []) {
        out.push({
          assignmentId: a.assignmentId,
          title: a.title || 'Bài tập',
          sessionTitle: s.title || 'Buổi học',
          scheduledDate: s.scheduledDate,
          resultStatus: a.resultStatus ?? null,
          scoreDisplay: a.scoreDisplay ?? null,
        });
      }
    }
    return out;
  }, [sessions]);

  const assignmentColumns = useMemo(() => {
    return [
      {
        title: 'Bài tập',
        dataIndex: 'title',
        key: 'title',
        render: (v: string, r: StudentClassAssignmentsRow) => (
          <button
            type="button"
            className="cursor-pointer text-left text-blue-600 hover:underline"
            onClick={() => openAssignment(r.assignmentId)}
          >
            {v}
          </button>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'resultStatus',
        key: 'resultStatus',
        width: 140,
        render: (v: number | null) => (
          <Tag color={v === CRM_ASSIGNMENT_RESULT_STATUS.GRADED ? 'blue' : 'default'} className="m-0">
            {v === CRM_ASSIGNMENT_RESULT_STATUS.GRADED ? 'Đã chấm' : 'Chờ chấm'}
          </Tag>
        ),
      },
      {
        title: 'Điểm',
        dataIndex: 'scoreDisplay',
        key: 'scoreDisplay',
        width: 120,
        render: (v: string | null) => (v && String(v).trim() ? <strong>{v}</strong> : '—'),
      },
      {
        title: 'Buổi học',
        dataIndex: 'sessionTitle',
        key: 'sessionTitle',
        width: 260,
      },
      {
        title: 'Ngày',
        dataIndex: 'scheduledDate',
        key: 'scheduledDate',
        width: 120,
        render: (v: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—'),
      },
    ];
  }, [openAssignment]);

  const classAccessNotice = resolveReadOnlyNoticeMessage(overview?.readOnlyReason);

  return (
    <>
      <PageHeader
        title={
          <LearningAccessNoticeInline message={classAccessNotice}>
            {classLabel}
          </LearningAccessNoticeInline>
        }
        description="Xem buổi học, bài tập, checklist và điểm danh của lớp."
        leading={
          <Link href="/classes">
            <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
          </Link>
        }
      />

      <PageCard>
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as typeof tab)}
          items={[
            {
              key: 'sessions',
              label: 'Các buổi học',
              children: (
                <ClassSessionsTab loading={overviewLoading} overview={overview} />
              ),
            },
            {
              key: 'vocabulary',
              label: 'Từ vựng',
              children: (
                <ClassVocabularyTab loading={overviewLoading} overview={overview} />
              ),
            },
            {
              key: 'assignments',
              label: 'Bài tập',
              children: (
                <ClassAssignmentsTab
                  loading={overviewLoading}
                  rows={flattenedAssignments}
                  columns={assignmentColumns}
                />
              ),
            },
            {
              key: 'checklists',
              label: 'Checklist',
              children: (
                <ClassChecklistsTab
                  loading={checklistsLoading}
                  rows={rows}
                  status={status}
                  onStatusChange={setStatus}
                  onOpenDetail={openDetail}
                />
              ),
            },
            {
              key: 'attendance',
              label: 'Điểm danh',
              children: <ClassAttendanceTab loading={overviewLoading} sessions={sessions} />,
            },
          ]}
        />
      </PageCard>

      <StudentChecklistDetailModal
        open={detailOpen}
        checklistId={detailId}
        onClose={closeDetail}
      />

      <StudentAssignmentDetailModal
        open={assignmentOpen}
        assignmentId={assignmentId}
        onClose={closeAssignment}
      />
    </>
  );
}


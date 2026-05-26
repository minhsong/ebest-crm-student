'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Skeleton, Typography, theme } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import { AssignmentsCourseTree } from '@/features/assignments/components/AssignmentsCourseTree';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import {
  groupAssignmentsFromOverview,
  type CourseAssignmentGroup,
} from '@/lib/assignments-overview-grouping';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

export default function StudentAssignmentsPage() {
  const { token } = theme.useToken();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<CourseAssignmentGroup[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAssignmentId, setModalAssignmentId] = useState<number | null>(null);

  const openAssignmentDetail = useCallback((assignmentId: number) => {
    setModalAssignmentId(assignmentId);
    setModalOpen(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(OVERVIEW_SESSIONS_PATH);
      const data = (await res.json().catch(() => [])) as unknown;
      const blocks = Array.isArray(data) ? (data as OverviewClassSessions[]) : [];
      setGroups(groupAssignmentsFromOverview(blocks));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách bài tập.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card title="Bài tập">
      <Typography.Paragraph type="secondary" style={{ marginBottom: token.marginMD }}>
        Danh sách theo khóa học, lớp và buổi học. Bấm <strong>tên bài</strong> hoặc{' '}
        <strong>điểm</strong> để xem chi tiết; icon loại bài hiển thị khi rê chuột.
      </Typography.Paragraph>
      {error ? (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: token.marginMD }}
        />
      ) : null}
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : groups.length === 0 ? (
        <Typography.Text type="secondary">Chưa có bài tập nào.</Typography.Text>
      ) : (
        <AssignmentsCourseTree groups={groups} onOpenAssignment={openAssignmentDetail} />
      )}
      <StudentAssignmentDetailModal
        open={modalOpen}
        assignmentId={modalAssignmentId}
        onClose={() => {
          setModalOpen(false);
          setModalAssignmentId(null);
        }}
      />
    </Card>
  );
}

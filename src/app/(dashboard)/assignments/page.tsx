'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Card,
  Collapse,
  List,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import { useAuth } from '@/contexts/auth-context';
import { AssignmentOverviewRowActions } from '@/features/schedule/components/AssignmentOverviewRowActions';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import { formatAssignmentDeadlineVi } from '@/features/quiz-test/lib/quiz-assignment-overview';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import {
  groupAssignmentsFromOverview,
  type CourseAssignmentGroup,
} from '@/lib/assignments-overview-grouping';
import {
  assignmentResultShort,
  assignmentResultTagColor,
} from '@/lib/assignment-quiz-ui';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

export default function StudentAssignmentsPage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<CourseAssignmentGroup[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAssignmentId, setModalAssignmentId] = useState<number | null>(null);

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

  const collapseItems = useMemo(
    () =>
      groups.map((course) => ({
        key: course.courseName,
        label: (
          <span>
            <Typography.Text strong>{course.courseName}</Typography.Text>
            <Typography.Text type="secondary" className="ml-2 text-xs">
              (
              {course.classes.reduce(
                (n, c) =>
                  n + c.sessions.reduce((s, ses) => s + ses.assignments.length, 0),
                0,
              )}{' '}
              bài)
            </Typography.Text>
          </span>
        ),
        children: (
          <div className="space-y-6">
            {course.classes.map((cls) => (
              <div key={cls.classId}>
                <Typography.Text type="secondary" className="text-xs block mb-3">
                  Lớp: {cls.className} ({cls.classCode})
                </Typography.Text>
                {cls.sessions.map((session) => (
                  <div key={session.sessionId} className="mb-4">
                    <Typography.Text strong className="text-sm block mb-2">
                      Buổi: {session.sessionTitle}
                      {session.scheduledDate ? (
                        <Typography.Text type="secondary" className="ml-2 font-normal">
                          ({new Date(session.scheduledDate).toLocaleDateString('vi-VN')})
                        </Typography.Text>
                      ) : null}
                    </Typography.Text>
                    <List
                      size="small"
                      dataSource={session.assignments}
                      renderItem={(row) => {
                        const deadlineText = formatAssignmentDeadlineVi(row.deadline);
                        const openDetail = () => {
                          setModalAssignmentId(row.assignmentId);
                          setModalOpen(true);
                        };
                        return (
                          <List.Item
                            actions={[
                              <AssignmentOverviewRowActions
                                key="actions"
                                row={row}
                                onOpenDetail={openDetail}
                                size="small"
                              />,
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <span>
                                  {row.title}{' '}
                                  <Tag
                                    color={assignmentResultTagColor(row.resultStatus)}
                                    className="m-0"
                                  >
                                    {assignmentResultShort(row.resultStatus)}
                                  </Tag>
                                </span>
                              }
                              description={
                                <span className="text-neutral-600 text-xs">
                                  {row.exerciseType
                                    ? `Loại: ${row.exerciseType}`
                                    : 'Bài tập'}
                                  {row.scoreDisplay?.trim() ? (
                                    <>
                                      {' '}
                                      · Điểm: <strong>{row.scoreDisplay}</strong>
                                    </>
                                  ) : null}
                                  {deadlineText ? (
                                    <>
                                      <br />
                                      Hạn: {deadlineText}
                                    </>
                                  ) : null}
                                </span>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ),
      })),
    [groups],
  );

  return (
    <Card title="Bài tập">
      <Typography.Paragraph type="secondary">
        Danh sách bài tập theo khóa học, lớp và buổi học. Bài trắc nghiệm chưa có điểm: nút Làm
        bài; đã có điểm hoặc cần xem thêm: Chi tiết (deadline, làm lại, xem kết quả).
      </Typography.Paragraph>
      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : groups.length === 0 ? (
        <Typography.Text type="secondary">Chưa có bài tập nào.</Typography.Text>
      ) : (
        <Collapse
          items={collapseItems}
          defaultActiveKey={collapseItems.map((i) => i.key)}
        />
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

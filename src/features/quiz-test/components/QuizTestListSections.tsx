'use client';

import {
  Button,
  Card,
  Col,
  Divider,
  List,
  Row,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import { formatAssignmentDeadlineVi } from '@/features/quiz-test/lib/quiz-assignment-overview';
import { buildQuizListItemUiState } from '@/features/quiz-test/lib/quiz-list-item-state';
import type { QuizAttemptProgressItem, QuizAssignmentListItem } from '@/features/quiz-test/types';
import { assignmentResultShort, assignmentResultTagColor } from '@/lib/assignment-quiz-ui';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';

export type QuizTestListStatsRowProps = {
  assignmentNeedDoCount: number;
  assignmentDoneCount: number;
};

export function QuizTestListStatsRow({
  assignmentNeedDoCount,
  assignmentDoneCount,
}: QuizTestListStatsRowProps) {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12}>
        <Card size="small">
          <Statistic title="Quiz bài tập cần làm" value={assignmentNeedDoCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12}>
        <Card size="small">
          <Statistic title="Quiz bài tập đã chấm" value={assignmentDoneCount} />
        </Card>
      </Col>
    </Row>
  );
}

export type QuizTestAssignmentSectionProps = {
  items: QuizAssignmentListItem[];
  progressByForm: Record<string, QuizAttemptProgressItem>;
};

export function QuizTestAssignmentSection({
  items,
  progressByForm,
}: QuizTestAssignmentSectionProps) {
  if (items.length === 0) return null;
  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Quiz từ bài tập lớp
      </Typography.Title>
      <List
        dataSource={items}
        renderItem={(row) => {
          const progress = progressByForm[row.formPublicId];
          const { actionLabel, buttonType, statusLine } = buildQuizListItemUiState(progress);
          const deadlineText = formatAssignmentDeadlineVi(row.deadline);
          return (
            <List.Item
              actions={[
                <Link
                  key="go"
                  href={`/quiz-test/${encodeURIComponent(row.formPublicId)}?assignmentId=${row.assignmentId}`}
                >
                  <Button type={buttonType}>
                    {row.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED
                      ? 'Xem lại'
                      : actionLabel}
                  </Button>
                </Link>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    {row.assignmentTitle}{' '}
                    <Tag
                      color={assignmentResultTagColor(row.resultStatus)}
                      style={{ marginInlineStart: 8 }}
                    >
                      {assignmentResultShort(row.resultStatus)}
                    </Tag>
                  </span>
                }
                description={
                  <span className="text-neutral-600">
                    {row.sessionTitle ? `Buổi: ${row.sessionTitle}` : 'Bài tập lớp'}
                    <br />
                    Điểm: <strong>{row.scoreDisplay?.trim() || '—'}</strong>
                    {row.quizMaxAttempts != null ? (
                      <>
                        {' '}
                        · Số lần tối đa: <strong>{row.quizMaxAttempts}</strong>
                      </>
                    ) : null}
                    {deadlineText ? (
                      <>
                        <br />
                        Deadline: {deadlineText}
                      </>
                    ) : null}
                    {statusLine ? (
                      <>
                        <br />
                        {statusLine}
                      </>
                    ) : null}
                  </span>
                }
              />
            </List.Item>
          );
        }}
      />
      <Divider />
    </>
  );
}

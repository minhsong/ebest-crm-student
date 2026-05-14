'use client';

import { Alert, Button, Empty, Skeleton, Typography } from 'antd';
import { PageCard, PageHeader } from '@/components/layout';
import { useQuizTestListData } from '@/features/quiz-test/hooks/useQuizTestListData';
import { QuizTestAssignmentSection, QuizTestListStatsRow } from './QuizTestListSections';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';

export function QuizTestListClient() {
  const { loading, error, assignmentItems, missingLinkedQuizCount, progressByForm, load } =
    useQuizTestListData();

  const assignmentNeedDoCount = assignmentItems.filter(
    (x) => x.resultStatus !== CRM_ASSIGNMENT_RESULT_STATUS.GRADED,
  ).length;
  const assignmentDoneCount = assignmentItems.length - assignmentNeedDoCount;

  return (
    <>
      <PageHeader title="Quiz test" />
      <PageCard>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Bài tập Quiz
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0, maxWidth: 740 }}>
              Danh sách lấy từ bài tập buổi học của các lớp bạn đang học (một lần tải lịch, không gọi
              chi tiết từng bài). Chỉ hiển thị bài có loại Quiz và đã gắn đề.
            </Typography.Paragraph>
          </div>
          <Button onClick={() => load()} loading={loading} size="small">
            Làm mới danh sách
          </Button>
        </div>

        <QuizTestListStatsRow
          assignmentNeedDoCount={assignmentNeedDoCount}
          assignmentDoneCount={assignmentDoneCount}
        />

        {error ? <Alert type="error" showIcon className="mb-4" message={error} /> : null}

        {missingLinkedQuizCount > 0 ? (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={`Có ${missingLinkedQuizCount} bài tập Quiz chưa gắn đề công khai. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình đề.`}
          />
        ) : null}

        {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : null}

        {!loading && !error && assignmentItems.length === 0 ? (
          <Empty description="Hiện chưa có bài tập Quiz khả dụng." />
        ) : null}

        {!loading ? (
          <QuizTestAssignmentSection items={assignmentItems} progressByForm={progressByForm} />
        ) : null}
      </PageCard>
    </>
  );
}

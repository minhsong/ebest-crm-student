'use client';

import { Alert, Button, Empty, Skeleton, Typography } from 'antd';
import { PageCard, PageHeader } from '@/components/layout';
import { useQuizTestListData } from '@/features/quiz-test/hooks/useQuizTestListData';
import {
  QuizTestAssignmentSection,
  QuizTestListStatsRow,
  QuizTestPublicSection,
} from './QuizTestListSections';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';

export function QuizTestListClient() {
  const {
    loading,
    error,
    publicItems,
    assignmentItems,
    missingLinkedQuizCount,
    progressByForm,
    load,
  } = useQuizTestListData();

  const linkedFormIds = new Set(assignmentItems.map((x) => x.formPublicId));
  const standalonePublicItems = publicItems.filter((x) => !linkedFormIds.has(x.formPublicId));
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
              Bài ôn / kiểm tra
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0, maxWidth: 740 }}>
              Trang này tổng hợp cả đề quiz mở và quiz gắn bài tập. Bạn có thể theo dõi bài cần
              làm, bài đã làm, và điểm số tập trung mà không cần mở từng card buổi học.
            </Typography.Paragraph>
          </div>
          <Button onClick={() => load()} loading={loading} size="small">
            Làm mới danh sách
          </Button>
        </div>

        <QuizTestListStatsRow
          assignmentNeedDoCount={assignmentNeedDoCount}
          assignmentDoneCount={assignmentDoneCount}
          standalonePublicCount={standalonePublicItems.length}
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

        {!loading && !error && assignmentItems.length === 0 && standalonePublicItems.length === 0 ? (
          <Empty description="Hiện chưa có đề hoặc bài quiz khả dụng." />
        ) : null}

        {!loading ? (
          <>
            <QuizTestAssignmentSection
              items={assignmentItems}
              progressByForm={progressByForm}
            />
            <QuizTestPublicSection
              items={standalonePublicItems}
              progressByForm={progressByForm}
            />
          </>
        ) : null}
      </PageCard>
    </>
  );
}

'use client';

import { QuizAssignmentResultsClient } from '@/features/quiz-test/components/QuizAssignmentResultsClient';
import { useQuizDeliveryContext } from '@/features/quiz-test/hooks/useQuizDeliveryContext';
import { Alert, Card, Skeleton } from 'antd';
import Link from 'next/link';

type Props = {
  formPublicId: string;
};

export function QuizAssignmentResultsEntryClient({ formPublicId }: Props) {
  const { access, loading, error, assignmentId } = useQuizDeliveryContext(formPublicId);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (access?.mode !== 'assignment' || assignmentId == null) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message={
            error ??
            'Đề này không gắn bài tập lớp của bạn, hoặc chỉ mở được ở chế độ ôn luyện.'
          }
        />
        <Link href="/assignments" className="mt-4 inline-block">
          Danh sách bài tập
        </Link>
      </Card>
    );
  }

  return (
    <QuizAssignmentResultsClient
      formPublicId={formPublicId}
      assignmentId={assignmentId}
      access={access}
    />
  );
}

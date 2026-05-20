'use client';

import Link from 'next/link';
import { Button, Space, Spin, Typography } from 'antd';
import { EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useAssignmentQuizAction } from '@/features/quiz-test/hooks/useAssignmentQuizAction';
import { pinAssignmentQuizRuntimeAccess } from '@/lib/quiz-runtime-access';

type Props = {
  formPublicId: string;
  assignmentId: number;
  /** E3: false khi đã rời lớp / không ACTIVE — vẫn cho xem kết quả cũ */
  allowStart?: boolean;
  /** Đã chấm điểm trên assignment_result — ưu tiên gợi ý ôn luyện */
  resultStatus?: number | null;
  gradedStatus?: number;
  size?: 'small' | 'middle';
};

export function AssignmentQuizActionButtons({
  formPublicId,
  assignmentId,
  allowStart = true,
  resultStatus,
  gradedStatus,
  size = 'middle',
}: Props) {
  const {
    loading,
    canStart: canStartFromApi,
    canViewResults,
    resultsPageHref,
    startBlockReason,
    eligibility,
  } = useAssignmentQuizAction(formPublicId, assignmentId);
  const canStart = canStartFromApi && allowStart;

  if (loading) {
    return <Spin size="small" />;
  }

  const isGraded =
    gradedStatus != null && resultStatus != null && resultStatus === gradedStatus;

  if (isGraded) {
    return (
      <Link href="/practice-quizzes" prefetch={false}>
        <Button size={size}>Ôn luyện</Button>
      </Link>
    );
  }

  const pinAssignmentContext = () => {
    pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId);
  };

  if (canStart && canViewResults && resultsPageHref) {
    return (
      <Space size="small" wrap>
        <Link
          href={`/quiz-test/${encodeURIComponent(formPublicId)}`}
          prefetch={false}
          onClick={pinAssignmentContext}
        >
          <Button type="primary" size={size} icon={<PlayCircleOutlined />}>
            Làm bài
          </Button>
        </Link>
        <Link href={resultsPageHref} prefetch={false} onClick={pinAssignmentContext}>
          <Button size={size} icon={<EyeOutlined />}>
            Xem kết quả
          </Button>
        </Link>
      </Space>
    );
  }

  if (canStart) {
    return (
      <Link
        href={`/quiz-test/${encodeURIComponent(formPublicId)}`}
        prefetch={false}
        onClick={pinAssignmentContext}
      >
        <Button type="primary" size={size} icon={<PlayCircleOutlined />}>
          Làm bài
        </Button>
      </Link>
    );
  }

  if (canViewResults && resultsPageHref) {
    return (
      <Link href={resultsPageHref} prefetch={false} onClick={pinAssignmentContext}>
        <Button type="primary" size={size} icon={<EyeOutlined />}>
          Xem kết quả
        </Button>
      </Link>
    );
  }

  return (
    <Typography.Text type="secondary" className="text-xs">
      {startBlockReason ?? 'Không thể làm bài.'}
      {eligibility?.submittedCount === 0 ? ' Chưa có lần làm nào.' : null}
    </Typography.Text>
  );
}

'use client';

import Link from 'next/link';
import { Alert, Button, Card, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { QuizAttemptHistoryList } from '@/features/quiz-test/components/QuizAttemptHistoryList';
import { QuizAttemptQuotaSummary } from '@/features/quiz-test/components/QuizAttemptQuotaSummary';
import { useQuizAssignmentResults } from '@/features/quiz-test/hooks/useQuizAssignmentResults';
import {
  computeCanViewResultDetails,
  describeQuizResultDetailLocked,
  logQuizResultDetailGate,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { useMemo, useEffect } from 'react';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { pinAssignmentQuizRuntimeAccess } from '@/lib/quiz-runtime-access';

type Props = {
  formPublicId: string;
  assignmentId: number;
  access: QuizRuntimeAccess;
};

export function QuizAssignmentResultsClient({
  formPublicId,
  assignmentId,
  access,
}: Props) {
  const {
    formName,
    loading,
    error,
    eligibility,
    attempts,
    canStart,
    startBlockReason,
    canViewDetail: canViewDetailFromAction,
    attemptsRemaining,
    refreshHistory,
  } = useQuizAssignmentResults(formPublicId, assignmentId, access);

  const canViewDetail = useMemo(
    () => computeCanViewResultDetails({ eligibility }).canView,
    [eligibility],
  );

  useEffect(() => {
    logQuizResultDetailGate('assignment-results', eligibility, {
      canViewDetailFromAction,
      canViewDetailRecomputed: canViewDetail,
      assignmentId,
      effectiveMaxAttempts: access.effectiveMaxAttempts,
    });
  }, [
    assignmentId,
    access.effectiveMaxAttempts,
    canViewDetail,
    canViewDetailFromAction,
    eligibility,
  ]);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        <Link href="/assignments">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách bài tập
          </Button>
        </Link>

        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Kết quả làm bài
          </Typography.Title>
          <Typography.Text type="secondary">{formName}</Typography.Text>
        </div>

        {error ? <Alert type="error" showIcon message={error} /> : null}

        <QuizAttemptQuotaSummary eligibility={eligibility} />

        {!canStart && startBlockReason ? (
          <Alert
            type="info"
            showIcon
            message={
              attemptsRemaining === 0
                ? 'Bạn đã dùng hết số lần làm bài.'
                : startBlockReason
            }
          />
        ) : null}

        {canStart && attemptsRemaining != null && attemptsRemaining > 0 ? (
          <Link
            href={`/quiz-test/${encodeURIComponent(formPublicId)}`}
            onClick={() =>
              pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId, {
                quizMaxAttempts: access.effectiveMaxAttempts,
              })
            }
          >
            <Button type="primary" icon={<PlayCircleOutlined />}>
              Làm bài ({attemptsRemaining} lượt còn lại)
            </Button>
          </Link>
        ) : null}

        {attempts.length > 0 ? (
          <QuizAttemptHistoryList
            formPublicId={formPublicId}
            rows={attempts}
            title="Các lần làm bài"
            description={
              canViewDetail
                ? 'Bấm từng lần làm để xem thông tin và kết quả bài của bạn.'
                : 'Danh sách các lần đã nộp. Chi tiết đáp án mở khi hết lượt hoặc đạt 100%.'
            }
            vertical
            showScore
            allowDetailLinks={canViewDetail}
            detailAnswersLockedHint={
              canViewDetail ? null : describeQuizResultDetailLocked(eligibility)
            }
            onRefresh={refreshHistory}
          />
        ) : (
          <Typography.Text type="secondary">
            Chưa có lần làm bài đã nộp. Hãy bắt đầu làm bài khi còn lượt.
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { QuizAttemptHistoryList } from '@/features/quiz-test/components/QuizAttemptHistoryList';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptHistoryItem, QuizPublishedFormPayload } from '@/features/quiz-test/types';
import { loadAssignmentQuizActionStateWithAccess } from '@/lib/quiz-assignment-action';
import {
  fetchGatewayAssignmentQuizStats,
  historyItemsFromGatewayStats,
} from '@/lib/quiz-gateway-stats';
import { fetchQuizStartEligibility } from '@/lib/quiz-assignment-crm';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { pinAssignmentQuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { QUIZ_RESULT_DETAIL_LOCKED_DESCRIPTION } from '@/features/quiz-test/lib/quiz-result-view-policy';

type Props = {
  formPublicId: string;
  assignmentId: number;
  access: QuizRuntimeAccess;
};

export function QuizAssignmentResultsClient({ formPublicId, assignmentId, access }: Props) {
  const [formName, setFormName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptHistoryItem[]>([]);
  const [canStart, setCanStart] = useState(false);
  const [startReason, setStartReason] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [canViewDetail, setCanViewDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId, {
        quizMaxAttempts: access.effectiveMaxAttempts,
      });

      const [formRes, action] = await Promise.all([
        fetchQuizRuntimeJson<QuizPublishedFormPayload>(
          quizRuntimePublicUrl(`forms/${formPublicId}`),
        ),
        loadAssignmentQuizActionStateWithAccess(
          formPublicId,
          assignmentId,
          access,
          access.effectiveMaxAttempts,
        ),
      ]);

      if (formRes.ok && formRes.data?.name) {
        setFormName(String(formRes.data.name));
      } else {
        setFormName('Bài trắc nghiệm');
      }

      setAttempts(action.submittedAttempts);
      setCanStart(action.canStart);
      setStartReason(action.startBlockReason);
      setAttemptsRemaining(action.eligibility?.attemptsRemaining ?? null);
      setCanViewDetail(action.canViewResults);

      if (action.submittedAttempts.length === 0 && !action.canStart) {
        setError(action.startBlockReason ?? 'Chưa có lần làm bài để xem.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [access, assignmentId, formPublicId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshHistory = useCallback(async () => {
    const stats = await fetchGatewayAssignmentQuizStats(
      formPublicId,
      assignmentId,
      access.effectiveMaxAttempts,
    );
    const filtered = stats ? historyItemsFromGatewayStats(formPublicId, stats) : [];
    setAttempts(filtered);
    const gate = await fetchQuizStartEligibility(assignmentId);
    setCanStart(gate.allowed);
    setStartReason(gate.allowed ? null : gate.reason);
    if (stats) {
      setAttemptsRemaining(stats.attemptsRemaining);
    }
    return filtered;
  }, [access.effectiveMaxAttempts, assignmentId, formPublicId]);

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

        {!canStart && startReason ? (
          <Alert
            type="info"
            showIcon
            message={
              attemptsRemaining === 0
                ? 'Bạn đã dùng hết số lần làm bài.'
                : startReason
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
                ? 'Chọn một lần để xem đáp án, điểm từng câu và giải thích (theo đề đã freeze khi làm bài).'
                : QUIZ_RESULT_DETAIL_LOCKED_DESCRIPTION
            }
            vertical
            showScore
            allowDetailLinks={canViewDetail}
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

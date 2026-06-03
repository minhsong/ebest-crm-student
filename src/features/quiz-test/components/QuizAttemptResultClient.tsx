'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptResultHeader } from '@/features/quiz-test/components/QuizAttemptResultHeader';
import { QuizResultDetailLockedHint } from '@/features/quiz-test/components/QuizResultDetailLockedHint';
import { QuizReviewQuestionsPanel } from '@/features/quiz-test/components/QuizReviewQuestionsPanel';
import {
  findSectionIdForAnchorKey,
  isAnchorKeyInForm,
  quizAnchorDomId,
} from '@/features/quiz-test/lib/quiz-section-navigation';
import { useQuizAttemptResultPage } from '@/features/quiz-test/hooks/useQuizAttemptResultPage';
import { buildAssignmentResultsHref } from '@/lib/quiz-assignment-action';
import { buildQuizResultEligibility } from '@/features/quiz-test/lib/quiz-result-view-policy';
import { Alert, Button, Card, Skeleton, Space, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  formPublicId: string;
  attemptPublicId: string;
  initialQuestionKey?: string | null;
};

export function QuizAttemptResultClient({
  formPublicId,
  attemptPublicId,
  initialQuestionKey,
}: Props) {
  const {
    error,
    loading,
    practiceMode,
    assignmentId,
    assignmentAction,
    reviewViewModel,
    canViewData,
  } = useQuizAttemptResultPage(formPublicId, attemptPublicId);

  const questionKey = useMemo(() => {
    if (initialQuestionKey == null || typeof initialQuestionKey !== 'string') return null;
    const t = initialQuestionKey.trim();
    if (!t) return null;
    try {
      return decodeURIComponent(t);
    } catch {
      return t;
    }
  }, [initialQuestionKey]);

  const [sectionKeysForAnchor, setSectionKeysForAnchor] = useState<string[]>([]);

  useEffect(() => {
    setSectionKeysForAnchor([]);
  }, [attemptPublicId]);

  useEffect(() => {
    if (loading || !reviewViewModel) return;
    if (reviewViewModel.sectionsOrdered.length <= 1) return;
    setSectionKeysForAnchor((prev) =>
      prev.length > 0 ? prev : reviewViewModel.allSectionKeys,
    );
  }, [loading, reviewViewModel]);

  useEffect(() => {
    if (loading || !reviewViewModel) return;
    if (!questionKey) return;
    if (!isAnchorKeyInForm(reviewViewModel.renderBlocks, questionKey)) return;

    const sid = findSectionIdForAnchorKey(
      reviewViewModel.formPayload,
      reviewViewModel.renderBlocks,
      questionKey,
    );
    if (sid != null) {
      const k = String(sid);
      setSectionKeysForAnchor((prev) => {
        const base = prev.length > 0 ? prev : reviewViewModel.allSectionKeys;
        if (base.includes(k)) return base;
        return [...base, k];
      });
    }

    const id = quizAnchorDomId(questionKey);
    const delay = reviewViewModel.sectionsOrdered.length > 1 ? 400 : 120;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [loading, questionKey, reviewViewModel]);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error || !reviewViewModel) {
    return (
      <Card>
        <Space direction="vertical">
          <Link href={!practiceMode ? '/assignments' : '/practice-quizzes'}>
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              {!practiceMode ? 'Bài tập' : 'Ôn luyện'}
            </Button>
          </Link>
          <Alert type="error" message={error ?? 'Không có dữ liệu kết quả'} showIcon />
          <Link href={`/quiz-test/${formPublicId}`}>
            <Button>Quay lại đề</Button>
          </Link>
        </Space>
      </Card>
    );
  }

  const canViewDetails = canViewData?.canView === true;
  const showCannotViewHint = !canViewDetails && canViewData !== null;
  const lockedEligibility = canViewData
    ? buildQuizResultEligibility({
        submittedCount: canViewData.submittedCount,
        hasPerfectScore: canViewData.hasPerfectScore,
        maxAttempts: canViewData.maxAttempts,
        attemptsRemaining: canViewData.attemptsRemaining,
      })
    : null;

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        <Link href={!practiceMode ? '/assignments' : '/practice-quizzes'}>
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            {!practiceMode ? 'Bài tập' : 'Ôn luyện'}
          </Button>
        </Link>

        <QuizAttemptResultHeader
          formPayload={reviewViewModel.formPayload}
          formDisplayName={reviewViewModel.formDisplayName}
          formTagKeys={reviewViewModel.formTagKeys}
          durationSummary={reviewViewModel.durationSummary}
          attemptStatus={reviewViewModel.attempt.status}
          attemptStartedAt={reviewViewModel.attempt.startedAt}
          attemptSubmittedAt={reviewViewModel.attempt.submittedAt}
          grading={reviewViewModel.attempt.grading}
        />

        {showCannotViewHint ? (
          <QuizResultDetailLockedHint eligibility={lockedEligibility} />
        ) : null}

        {canViewDetails ? (
          <QuizReviewQuestionsPanel
            viewModel={reviewViewModel}
            collapseActiveKeys={sectionKeysForAnchor}
            onCollapseActiveKeysChange={setSectionKeysForAnchor}
          />
        ) : (
          <div className="py-8 text-center">
            <Typography.Text type="secondary">
              Nội dung đáp án chi tiết sẽ hiển thị khi bạn đủ điều kiện.
            </Typography.Text>
          </div>
        )}

        <Space wrap>
          {assignmentId != null && assignmentId >= 1 ? (
            <>
              {assignmentAction?.canStart ? (
                <Link href={`/quiz-test/${formPublicId}`}>
                  <Button type="primary">Làm bài mới</Button>
                </Link>
              ) : null}
              <Link href={buildAssignmentResultsHref(formPublicId)}>
                <Button type="default">Các lần làm khác</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href={`/quiz-test/${formPublicId}`}>
                <Button color="green" variant="solid">
                  Làm bài mới
                </Button>
              </Link>
              <Link href="/practice-quizzes">
                <Button type="default">Danh sách ôn luyện</Button>
              </Link>
            </>
          )}
        </Space>
      </Space>
    </Card>
  );
}

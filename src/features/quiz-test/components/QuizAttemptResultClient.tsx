'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptResultHeader } from '@/features/quiz-test/components/QuizAttemptResultHeader';
import { QuizResultDetailLockedHint } from '@/features/quiz-test/components/QuizResultDetailLockedHint';
import { QuizReviewQuestionsPanel } from '@/features/quiz-test/components/QuizReviewQuestionsPanel';
import { QuizAttemptSectionToolbar } from '@/features/quiz-test/components/QuizAttemptSectionToolbar';
import { QuizSectionOutlineDrawer } from '@/features/quiz-test/components/QuizSectionOutlineDrawer';
import {
  findSectionIdForAnchorKey,
  getQuizQuestionScrollDelayMs,
  isAnchorKeyInForm,
  mergeQuizOutlineSectionExpandKeys,
  scrollToQuizQuestionAnchor,
} from '@/features/quiz-test/lib/quiz-section-navigation';
import { useQuizSectionOutline } from '@/features/quiz-test/hooks/useQuizSectionOutline';
import { useQuizAttemptResultPage } from '@/features/quiz-test/hooks/useQuizAttemptResultPage';
import { buildAssignmentResultsHref } from '@/lib/quiz-assignment-action';
import { buildQuizResultEligibility } from '@/features/quiz-test/lib/quiz-result-view-policy';
import { Alert, Button, Card, Skeleton, Space, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
  const [outlineOpen, setOutlineOpen] = useState(true);

  const { showOutline } = useQuizSectionOutline(
    reviewViewModel?.formPayload,
    reviewViewModel?.renderBlocks,
    {
      enabled: Boolean(reviewViewModel),
      sectionCount: reviewViewModel?.sectionsOrdered.length,
    },
  );

  const navigateToQuestion = useCallback(
    (sectionId: number | null, formItemId: string) => {
      if (!reviewViewModel) return;
      if (sectionId != null && Number.isFinite(sectionId)) {
        setSectionKeysForAnchor((prev) =>
          mergeQuizOutlineSectionExpandKeys(
            prev,
            sectionId,
            reviewViewModel.allSectionKeys,
          ),
        );
      }
      scrollToQuizQuestionAnchor(formItemId, {
        delayMs: getQuizQuestionScrollDelayMs(reviewViewModel.sectionsOrdered.length),
      });
    },
    [reviewViewModel],
  );

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
      setSectionKeysForAnchor((prev) =>
        mergeQuizOutlineSectionExpandKeys(prev, sid, reviewViewModel.allSectionKeys),
      );
    }

    return scrollToQuizQuestionAnchor(questionKey, {
      delayMs: getQuizQuestionScrollDelayMs(reviewViewModel.sectionsOrdered.length),
    });
  }, [loading, questionKey, reviewViewModel]);

  /** Không đủ điều kiện D41 — chuyển về danh sách lần làm (hook phải trước mọi return). */
  useEffect(() => {
    if (loading) return;
    if (!canViewData || canViewData.canView) return;
    const back =
      assignmentId != null && assignmentId >= 1
        ? `/quiz-test/${encodeURIComponent(formPublicId)}/results`
        : `/quiz-test/${encodeURIComponent(formPublicId)}`;
    router.replace(back);
  }, [assignmentId, canViewData, formPublicId, loading, router]);

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
          <Link href={!practiceMode ? '/assignments' : '/learning'}>
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
  const detailLocked = !canViewDetails && canViewData !== null;
  const lockedEligibility = canViewData
    ? buildQuizResultEligibility({
        submittedCount: canViewData.submittedCount,
        hasPerfectScore: canViewData.hasPerfectScore,
        maxAttempts: canViewData.maxAttempts,
        attemptsRemaining: canViewData.attemptsRemaining,
      })
    : null;

  if (detailLocked) {
    return (
      <Card>
        <Space direction="vertical" size="middle" className="w-full">
          <Link href={!practiceMode ? '/assignments' : '/learning'}>
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              {!practiceMode ? 'Bài tập' : 'Ôn luyện'}
            </Button>
          </Link>
          <QuizResultDetailLockedHint eligibility={lockedEligibility} />
          {assignmentId != null && assignmentId >= 1 ? (
            <Link href={buildAssignmentResultsHref(formPublicId)}>
              <Button type="default">Quay lại danh sách lần làm</Button>
            </Link>
          ) : null}
        </Space>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        <Link href={!practiceMode ? '/assignments' : '/learning'}>
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

        {showOutline ? (
          <QuizAttemptSectionToolbar
            showOutline={showOutline}
            outlineOpen={outlineOpen}
            onToggleOutline={() => setOutlineOpen((v) => !v)}
          />
        ) : null}

        {showOutline ? (
          <QuizSectionOutlineDrawer
            open={outlineOpen}
            onClose={() => setOutlineOpen(false)}
            formPayload={reviewViewModel.formPayload}
            allRenderBlocks={reviewViewModel.renderBlocks}
            activeQuestionKey={questionKey}
            onNavigateToQuestion={navigateToQuestion}
            mode="review"
            correctByFormItemId={reviewViewModel.correctByFormItemId}
          />
        ) : null}

        <QuizReviewQuestionsPanel
          viewModel={reviewViewModel}
          collapseActiveKeys={sectionKeysForAnchor}
          onCollapseActiveKeysChange={setSectionKeysForAnchor}
        />

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
              <Link href="/learning">
                <Button type="default">Danh sách ôn luyện</Button>
              </Link>
            </>
          )}
        </Space>
      </Space>
    </Card>
  );
}

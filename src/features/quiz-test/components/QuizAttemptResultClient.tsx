'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptQuestionBlocks } from '@/features/quiz-test/components/QuizAttemptQuestionBlocks';
import { QuizAttemptResultHeader } from '@/features/quiz-test/components/QuizAttemptResultHeader';
import type { QuizFormItemPayload, QuizFormSectionPayload } from '@/features/quiz-test/types';
import {
  collectFormTagKeysFromItems,
  formatQuizDurationSummary,
} from '@/features/quiz-test/lib/quiz-form-meta';
import {
  buildQuizRenderableBlocks,
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import { buildBlockStartIndexes } from '@/features/quiz-test/lib/quiz-runtime-view';
import {
  findSectionIdForAnchorKey,
  isAnchorKeyInForm,
  quizAnchorDomId,
} from '@/features/quiz-test/lib/quiz-section-navigation';
import { useQuizAttemptResultPage } from '@/features/quiz-test/hooks/useQuizAttemptResultPage';
import { buildAssignmentResultsHref } from '@/lib/quiz-assignment-action';
import { Alert, Button, Card, Collapse, Skeleton, Space } from 'antd';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export function QuizAttemptResultClient({
  formPublicId,
  attemptPublicId,
  initialQuestionKey,
}: {
  formPublicId: string;
  attemptPublicId: string;
  /** Từ `?question=` — anchor câu (formItemId hoặc composite bundle child). */
  initialQuestionKey?: string | null;
}) {
  const {
    formPayload,
    attempt,
    error,
    loading,
    practiceMode,
    assignmentId,
    assignmentAction,
    correctByFormItemId,
    gradingPerItem,
    canViewData,
    getCannotViewResultMessage,
  } = useQuizAttemptResultPage(formPublicId, attemptPublicId);

  // Build renderable blocks from form payload
  const renderBlocks = useMemo((): QuizRenderableBlock[] => {
    return buildQuizRenderableBlocks(formPayload);
  }, [formPayload]);

  // Extract all form items from blocks
  const items = useMemo((): QuizFormItemPayload[] => {
    return renderBlocks.flatMap((b) => (b.kind === 'single' ? [b.item] : b.items));
  }, [renderBlocks]);

  // Calculate block start indexes
  const blockStartIndexes = useMemo(() => {
    return buildBlockStartIndexes(renderBlocks);
  }, [renderBlocks]);

  // Sort sections by order
  const sectionsOrdered = useMemo((): QuizFormSectionPayload[] => {
    const s = formPayload?.sections;
    return Array.isArray(s)
      ? [...(s as QuizFormSectionPayload[])].sort((a, b) => a.order - b.order)
      : [];
  }, [formPayload?.sections]);

  // All section keys for collapse
  const allSectionKeys = useMemo(() => {
    return sectionsOrdered.map((s) => String(s.sectionId));
  }, [sectionsOrdered]);

  // Parse question key from URL
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

  // Collapse state
  const [collapseOpenKeys, setCollapseOpenKeys] = useState<string[]>([]);

  // Reset collapse when attempt changes
  useEffect(() => {
    setCollapseOpenKeys([]);
  }, [attemptPublicId]);

  // Auto-expand sections when multiple sections exist
  useEffect(() => {
    if (loading || !formPayload) return;
    if (sectionsOrdered.length <= 1) return;
    setCollapseOpenKeys((prev) => (prev.length > 0 ? prev : allSectionKeys));
  }, [allSectionKeys, formPayload, loading, sectionsOrdered.length]);

  // Scroll to question when URL has question anchor
  useEffect(() => {
    if (loading || !formPayload) return;
    if (!questionKey) return;
    if (!isAnchorKeyInForm(renderBlocks, questionKey)) return;

    const sid = findSectionIdForAnchorKey(formPayload, renderBlocks, questionKey);
    if (sid != null) {
      setCollapseOpenKeys((prev) => {
        const k = String(sid);
        const base = prev.length > 0 ? prev : allSectionKeys;
        if (base.includes(k)) return base;
        return [...base, k];
      });
    }

    const id = quizAnchorDomId(questionKey);
    const delay = sectionsOrdered.length > 1 ? 400 : 120;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [allSectionKeys, formPayload, loading, questionKey, renderBlocks, sectionsOrdered.length]);

  // Collect tag keys from items
  const formTagKeys = useMemo(() => {
    return collectFormTagKeysFromItems(items);
  }, [items]);

  // Format duration for display
  const durationSummary = useMemo(() => {
    return formatQuizDurationSummary(Number(formPayload?.durationSeconds ?? 0));
  }, [formPayload?.durationSeconds]);

  // Check if form allows showing explanations
  const showExplanationOnReview = useMemo(() => {
    const blueprint = formPayload?.blueprint as Record<string, unknown> | null | undefined;
    if (!blueprint || typeof blueprint !== 'object') return false;
    const review = blueprint?.review as Record<string, unknown> | null | undefined;
    if (!review || typeof review !== 'object') return false;
    return Boolean(review?.showExplanationOnReview);
  }, [formPayload?.blueprint]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  // Error state
  if (error || !formPayload || !attempt) {
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

  const attemptSubmitted =
    attempt?.status === 'submitted' || attempt?.status === 'expired';
  const hasGradingItems =
    Array.isArray(attempt?.grading?.items) && attempt.grading.items.length > 0;
  const canViewDetails =
    canViewData?.canView === true || hasGradingItems || attemptSubmitted;
  const cannotViewReason = canViewData?.reason ?? null;
  const showCannotViewAlert = !canViewDetails && canViewData !== null;

  const answers = attempt.answersByFormItemId ?? {};
  const formDisplayName =
    typeof formPayload.name === 'string' && formPayload.name.trim()
      ? formPayload.name.trim()
      : `Đề #${formPayload.crmFormId}`;

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        <Link href={!practiceMode ? '/assignments' : '/practice-quizzes'}>
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            {!practiceMode ? 'Bài tập' : 'Ôn luyện'}
          </Button>
        </Link>

        <QuizAttemptResultHeader
          formPayload={formPayload}
          formDisplayName={formDisplayName}
          formTagKeys={formTagKeys}
          durationSummary={durationSummary}
          attemptStatus={attempt.status}
          attemptStartedAt={attempt.startedAt}
          attemptSubmittedAt={attempt.submittedAt}
          grading={attempt.grading}
        />

        {/* Alert when user cannot view detailed results */}
        {showCannotViewAlert && cannotViewReason && canViewData ? (
          <Alert
            type="warning"
            message={
              <span>
                <strong>Chưa thể xem chi tiết kết quả</strong>
                <br />
                {getCannotViewResultMessage(cannotViewReason, canViewData)}
              </span>
            }
            showIcon
          />
        ) : null}

        {/* Render question blocks only if user can view details */}
        {canViewDetails ? (
          sectionsOrdered.length > 1 ? (
            <Collapse
              bordered={false}
              activeKey={collapseOpenKeys}
              onChange={(k) => setCollapseOpenKeys(Array.isArray(k) ? k : [String(k)])}
              items={sectionsOrdered.map((sec) => {
                const blocks = filterRenderableBlocksBySectionId(
                  formPayload,
                  renderBlocks,
                  sec.sectionId,
                );
                const idx = buildBlockStartIndexes(blocks);
                return {
                  key: String(sec.sectionId),
                  label: sec.title?.trim() || `Phần ${sec.order + 1}`,
                  children: (
                    <QuizAttemptQuestionBlocks
                      renderBlocks={blocks}
                      blockStartIndexes={idx}
                      answers={answers}
                      readOnly
                      correctByFormItemId={correctByFormItemId}
                      gradingPerItem={gradingPerItem}
                      showExplanation={showExplanationOnReview}
                    />
                  ),
                };
              })}
            />
          ) : (
            <QuizAttemptQuestionBlocks
              renderBlocks={renderBlocks}
              blockStartIndexes={blockStartIndexes}
              answers={answers}
              readOnly
              correctByFormItemId={correctByFormItemId}
              gradingPerItem={gradingPerItem}
              showExplanation={showExplanationOnReview}
            />
          )
        ) : (
          /* Placeholder when cannot view details - encourage student to try again */
          <div className="text-center py-8 text-gray-500">
            <p>
              {canViewData && cannotViewReason
                ? getCannotViewResultMessage(cannotViewReason, canViewData)
                : 'Hãy cố gắng hết sức để xem kết quả chi tiết nhé!'}
            </p>
          </div>
        )}

        <Space wrap>
          {assignmentId != null && assignmentId >= 1 ? (
            <>
              {assignmentAction?.canStart ? (
                <Link
                  href={`/quiz-test/${formPublicId}`}
                >
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

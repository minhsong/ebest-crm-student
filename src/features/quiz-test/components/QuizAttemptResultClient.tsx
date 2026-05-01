'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptQuestionBlocks } from '@/features/quiz-test/components/QuizAttemptQuestionBlocks';
import { QuizAttemptResultHeader } from '@/features/quiz-test/components/QuizAttemptResultHeader';
import type {
  QuizFormItemPayload,
} from '@/features/quiz-test/types';
import { collectFormTagKeysFromItems, formatQuizDurationSummary } from '@/features/quiz-test/lib/quiz-form-meta';
import {
  buildQuizRenderableBlocks,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  buildBlockStartIndexes,
  buildCorrectByFormItemId,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { useQuizAttemptResultData } from '@/features/quiz-test/components/useQuizAttemptResultData';
import { Alert, Button, Card, Skeleton, Space } from 'antd';
import Link from 'next/link';
import { useMemo } from 'react';

export function QuizAttemptResultClient({
  formPublicId,
  attemptPublicId,
}: {
  formPublicId: string;
  attemptPublicId: string;
}) {
  const { formPayload, attempt, error, loading } = useQuizAttemptResultData(
    formPublicId,
    attemptPublicId,
  );

  const renderBlocks = useMemo(
    (): QuizRenderableBlock[] => buildQuizRenderableBlocks(formPayload),
    [formPayload],
  );
  const items = useMemo(
    (): QuizFormItemPayload[] =>
      renderBlocks.flatMap((b) => (b.kind === 'single' ? [b.item] : b.items)),
    [renderBlocks],
  );
  const blockStartIndexes = useMemo(() => buildBlockStartIndexes(renderBlocks), [renderBlocks]);

  const formTagKeys = useMemo(() => collectFormTagKeysFromItems(items), [items]);

  const durationSummary = useMemo(
    () => formatQuizDurationSummary(Number(formPayload?.durationSeconds ?? 0)),
    [formPayload?.durationSeconds],
  );

  const correctByFormItemId = useMemo(
    () => buildCorrectByFormItemId(attempt?.grading?.items),
    [attempt?.grading?.items],
  );

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error || !formPayload || !attempt) {
    return (
      <Card>
        <Space direction="vertical">
          <Link href="/quiz-test">
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              Danh sách đề
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

  const answers = attempt.answersByFormItemId ?? {};
  const formDisplayName =
    typeof formPayload.name === 'string' && formPayload.name.trim()
      ? formPayload.name.trim()
      : `Đề #${formPayload.crmFormId}`;
  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
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

        <QuizAttemptQuestionBlocks
          renderBlocks={renderBlocks}
          blockStartIndexes={blockStartIndexes}
          answers={answers}
          readOnly
          correctByFormItemId={correctByFormItemId}
        />

        <Space wrap>
          <Link href={`/quiz-test/${formPublicId}`}>
            <Button color="green" variant="solid">
              Làm bài mới
            </Button>
          </Link>
          <Link href={`/quiz-test/${formPublicId}`}>
            <Button type="default">Các lần làm khác</Button>
          </Link>
        </Space>
      </Space>
    </Card>
  );
}

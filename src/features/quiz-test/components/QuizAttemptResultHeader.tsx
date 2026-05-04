'use client';

import { QuizFormMetaBlock } from '@/features/quiz-test/components/QuizFormMetaBlock';
import {
  getScoreSummary,
  getStatusLabel,
  getStatusTagColor,
  toViDateTime,
  type QuizGradingScoreInput,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import { Tag, Typography } from 'antd';

type QuizAttemptResultHeaderProps = {
  formPayload: QuizPublishedFormPayload;
  formDisplayName: string;
  formTagKeys: string[];
  durationSummary: string;
  attemptStatus: string;
  attemptStartedAt?: string;
  attemptSubmittedAt?: string | null;
  grading: QuizGradingScoreInput;
};

export function QuizAttemptResultHeader({
  formPayload,
  formDisplayName,
  formTagKeys,
  durationSummary,
  attemptStatus,
  attemptStartedAt,
  attemptSubmittedAt,
  grading,
}: QuizAttemptResultHeaderProps) {
  const statusLabel = getStatusLabel(attemptStatus);
  const statusTagColor = getStatusTagColor(attemptStatus);
  const scoreSummary = getScoreSummary(grading);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Chi tiết bài làm
        </Typography.Title>
        <Tag color={statusTagColor}>{statusLabel}</Tag>
      </div>
      <Typography.Title level={5} type="secondary" style={{ margin: 0 }}>
        {formDisplayName}
      </Typography.Title>
      <QuizFormMetaBlock
        formType={formPayload.type ?? null}
        catalogKey={formPayload.catalogKey ?? null}
        tagKeys={formTagKeys}
        durationSummary={durationSummary}
      />
      {scoreSummary ? (
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          Kết quả: <strong>{scoreSummary.correct}</strong> / <strong>{scoreSummary.total}</strong>{' '}
          câu đúng.
        </Typography.Paragraph>
      ) : null}
      {attemptStartedAt || attemptSubmittedAt ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {attemptStartedAt ? `Bắt đầu: ${toViDateTime(attemptStartedAt)}` : ''}
          {attemptStartedAt && attemptSubmittedAt ? ' · ' : ''}
          {attemptSubmittedAt ? `Nộp bài: ${toViDateTime(attemptSubmittedAt)}` : ''}
        </Typography.Paragraph>
      ) : null}
    </>
  );
}

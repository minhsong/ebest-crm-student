'use client';

import { getAttemptHistoryRowLabel, getHistoryScoreText, toViDateTime } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import { Button, Typography } from 'antd';
import Link from 'next/link';

type QuizAttemptHistoryListProps = {
  formPublicId: string;
  rows: QuizAttemptHistoryItem[];
  title: string;
  description?: string;
  vertical?: boolean;
  showScore?: boolean;
};

export function QuizAttemptHistoryList({
  formPublicId,
  rows,
  title,
  description,
  vertical = false,
  showScore = false,
}: QuizAttemptHistoryListProps) {
  if (!rows.length) return null;
  return (
    <div>
      <Typography.Text strong>{title}</Typography.Text>
      {description ? (
        <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
          {description}
        </Typography.Paragraph>
      ) : null}
      <div className={`mt-2 flex ${vertical ? 'flex-col' : 'flex-wrap'} gap-2`}>
        {rows.map((row) => (
          <Link
            key={row.attemptPublicId}
            href={`/quiz-test/${formPublicId}/attempts/${row.attemptPublicId}`}
          >
            <Button size="small" className={vertical ? 'w-full text-left' : undefined}>
              {getAttemptHistoryRowLabel(row.status)} · {toViDateTime(row.startedAt)}
              {showScore ? getHistoryScoreText(row) : ''}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptQuestionBlocks } from '@/features/quiz-test/components/QuizAttemptQuestionBlocks';
import { QuizFormMetaBlock } from '@/features/quiz-test/components/QuizFormMetaBlock';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  formatCountdownHhMmSs,
  getAttemptTimerValidity,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import type {
  QuizPublishedFormPayload,
  StartAttemptResponse,
} from '@/features/quiz-test/types';
import { HEADER_HEIGHT } from '@/lib/ui-constants';
import { Alert, Button, Card, Divider, Space, Tag, Typography } from 'antd';
import Link from 'next/link';

type QuizAttemptTakingSectionProps = {
  title: string;
  formPayload: QuizPublishedFormPayload;
  formTagKeys: string[];
  errMsg: string | null;
  attempt: StartAttemptResponse | null;
  remainingSeconds: number;
  answers: Record<string, string | string[]>;
  renderBlocks: QuizRenderableBlock[];
  blockStartIndexes: number[];
  onAnswerChange: (formItemId: string, value: string | string[]) => void;
  onSubmit: () => void;
  submitting: boolean;
};

export function QuizAttemptTakingSection({
  title,
  formPayload,
  formTagKeys,
  errMsg,
  attempt,
  remainingSeconds,
  answers,
  renderBlocks,
  blockStartIndexes,
  onAnswerChange,
  onSubmit,
  submitting,
}: QuizAttemptTakingSectionProps) {
  const timerOk = !!(attempt && getAttemptTimerValidity(attempt).ok);

  return (
    <Card styles={{ body: { padding: 0 } }}>
      {timerOk ? (
        <div
          className="sticky z-[100] flex justify-center border-b border-neutral-200 bg-white/90 py-2 backdrop-blur-sm md:justify-end md:px-6 dark:border-neutral-700 dark:bg-neutral-950/90"
          style={{ top: HEADER_HEIGHT }}
        >
          <Tag className="!m-0 inline-flex items-center justify-center border-2 !border-red-600 !bg-red-50 px-5 py-2 font-mono text-3xl font-bold tabular-nums !text-red-600 md:text-4xl dark:!border-red-500 dark:!bg-red-950/50 dark:!text-red-400">
            {formatCountdownHhMmSs(remainingSeconds)}
          </Tag>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 px-4 pb-4 pt-4 md:px-6">
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
          </Button>
        </Link>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <QuizFormMetaBlock
          compact
          formType={formPayload.type ?? null}
          catalogKey={formPayload.catalogKey ?? null}
          tagKeys={formTagKeys}
        />
      </div>

      {errMsg ? (
        <div className="px-4 md:px-6">
          <Alert className="mb-4" type="warning" message={errMsg} showIcon />
        </div>
      ) : null}

      <Space direction="vertical" size="large" className="w-full px-4 pb-6 md:px-6">
        <QuizAttemptQuestionBlocks
          renderBlocks={renderBlocks}
          blockStartIndexes={blockStartIndexes}
          answers={answers}
          readOnly={false}
          onAnswerChange={onAnswerChange}
        />
      </Space>

      <Divider className="!my-0" />

      <div className="px-4 pb-6 md:px-6">
        <Space>
          <Button type="primary" size="large" loading={submitting} onClick={onSubmit}>
            Nộp bài
          </Button>
        </Space>
      </div>
    </Card>
  );
}

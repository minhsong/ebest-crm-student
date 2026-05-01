'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  QuizAttemptConfirmSection,
  QuizAttemptDoneSection,
  QuizAttemptReadySection,
} from '@/features/quiz-test/components/QuizAttemptPhaseSections';
import { QuizAttemptTakingSection } from '@/features/quiz-test/components/QuizAttemptTakingSection';
import {
  collectFormTagKeysFromItems,
  formatQuizDurationSummary,
} from '@/features/quiz-test/lib/quiz-form-meta';
import {
  buildQuizRenderableBlocks,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  buildBlockStartIndexes,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { useQuizAttemptRuntime } from '@/features/quiz-test/components/useQuizAttemptRuntime';
import type {
  QuizFormItemPayload,
  QuizPublishedFormSummary,
} from '@/features/quiz-test/types';
import {
  Alert,
  Button,
  Card,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import { APP_BRAND } from '@/lib/ui-constants';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

export function QuizAttemptClient({
  formPublicId,
  initialSummary,
}: {
  formPublicId: string;
  initialSummary?: QuizPublishedFormSummary | null;
}) {
  const {
    phase,
    errMsg,
    formPayload,
    attempt,
    answers,
    submitResult,
    attemptHistory,
    remainingSeconds,
    rulesAcknowledged,
    setRulesAcknowledged,
    setPhase,
    loadForm,
    handleStart,
    onAnswerChange,
    handleSubmit,
    openConfirmStart,
  } = useQuizAttemptRuntime({ formPublicId });

  const renderBlocks = useMemo(
    (): QuizRenderableBlock[] => buildQuizRenderableBlocks(formPayload),
    [formPayload],
  );
  const items = useMemo(
    (): QuizFormItemPayload[] =>
      renderBlocks.flatMap((b) => (b.kind === 'single' ? [b.item] : b.items)),
    [renderBlocks],
  );
  const blockStartIndexes = useMemo(
    () => buildBlockStartIndexes(renderBlocks),
    [renderBlocks],
  );

  const formTagKeys = useMemo(() => collectFormTagKeysFromItems(items), [items]);

  const durationSummary = useMemo(
    () => formatQuizDurationSummary(Number(formPayload?.durationSeconds ?? 0)),
    [formPayload?.durationSeconds],
  );

  useEffect(() => {
    const name =
      (typeof formPayload?.name === 'string' && formPayload.name.trim()) ||
      (typeof initialSummary?.name === 'string' && initialSummary.name.trim());
    if (!name) return;
    const previous = document.title;
    document.title = `${name} | ${APP_BRAND}`;
    return () => {
      document.title = previous;
    };
  }, [formPayload?.name, initialSummary?.name]);

  const title =
    formPayload?.name ||
    initialSummary?.name ||
    `Đề (${formPublicId.slice(0, 8)}…)`;


  if (phase === 'loading_form' || phase === 'starting') {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (phase === 'error' || !formPayload) {
    return (
      <Card>
        <Space direction="vertical" size="middle" className="w-full">
          <Link href="/quiz-test">
            <Button type="default" size="small" icon={<ArrowLeftOutlined />}>
              Danh sách đề
            </Button>
          </Link>
          {errMsg ? <Alert type="error" message={errMsg} showIcon /> : null}
          <Button onClick={() => void loadForm()}>Thử lại</Button>
        </Space>
      </Card>
    );
  }

  if (phase === 'ready') {
    return (
      <QuizAttemptReadySection
        title={title}
        formPublicId={formPublicId}
        formPayload={formPayload}
        formTagKeys={formTagKeys}
        durationSummary={durationSummary}
        errMsg={errMsg}
        attemptHistory={attemptHistory}
        onOpenConfirmStart={openConfirmStart}
      />
    );
  }

  if (phase === 'confirm_start') {
    return (
      <QuizAttemptConfirmSection
        title={title}
        formPublicId={formPublicId}
        formPayload={formPayload}
        formTagKeys={formTagKeys}
        durationSummary={durationSummary}
        errMsg={errMsg}
        rulesAcknowledged={rulesAcknowledged}
        onRulesAcknowledgedChange={setRulesAcknowledged}
        onBack={() => setPhase('ready')}
        onStart={() => void handleStart()}
      />
    );
  }

  if (phase === 'done' && submitResult) {
    return (
      <QuizAttemptDoneSection
        title={title}
        formPublicId={formPublicId}
        formPayload={formPayload}
        formTagKeys={formTagKeys}
        durationSummary={durationSummary}
        submitResult={submitResult}
        attemptHistory={attemptHistory}
        onOpenConfirmStart={openConfirmStart}
      />
    );
  }

  return (
    <QuizAttemptTakingSection
      title={title}
      formPayload={formPayload}
      formTagKeys={formTagKeys}
      errMsg={errMsg}
      attempt={attempt}
      remainingSeconds={remainingSeconds}
      answers={answers}
      renderBlocks={renderBlocks}
      blockStartIndexes={blockStartIndexes}
      onAnswerChange={onAnswerChange}
      onSubmit={() => void handleSubmit()}
      submitting={phase === 'submitting'}
    />
  );
}

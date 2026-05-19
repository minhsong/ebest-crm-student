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
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  findSectionIdForAnchorKey,
  isAnchorKeyInForm,
  quizAnchorDomId,
} from '@/features/quiz-test/lib/quiz-section-navigation';
import {
  buildBlockStartIndexes,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { useQuizAttemptRuntime } from '@/features/quiz-test/components/useQuizAttemptRuntime';
import type {
  QuizFormSectionPayload,
  QuizFormItemPayload,
  QuizPublishedFormSummary,
} from '@/features/quiz-test/types';
import {
  Alert,
  Button,
  Card,
  Skeleton,
  Space,
} from 'antd';
import { APP_BRAND } from '@/lib/ui-constants';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

function blocksEqual(a: QuizRenderableBlock, b: QuizRenderableBlock): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'single' && b.kind === 'single') {
    return String(a.item.formItemId) === String(b.item.formItemId);
  }
  if (a.kind === 'bundle' && b.kind === 'bundle') {
    return a.bundleKey === b.bundleKey;
  }
  return false;
}

export function QuizAttemptClient({
  formPublicId,
  assignmentId,
  initialSummary,
  initialSectionId,
  initialQuestionKey,
}: {
  formPublicId: string;
  /** Từ query `?assignmentId=` khi vào đề từ bài tập — đồng bộ điểm sau submit. */
  assignmentId?: number;
  initialSummary?: QuizPublishedFormSummary | null;
  /** Từ query `?section=` — id section CRM. */
  initialSectionId?: number;
  /** Từ query `?question=` — key thô (formItemId hoặc `parent::child`). */
  initialQuestionKey?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listeningNavLocked, setListeningNavLocked] = useState(false);

  const questionKey = useMemo(() => {
    const raw = searchParams.get('question') ?? initialQuestionKey;
    if (raw == null || typeof raw !== 'string') return null;
    const t = raw.trim();
    if (!t) return null;
    try {
      return decodeURIComponent(t);
    } catch {
      return t;
    }
  }, [initialQuestionKey, searchParams]);

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
    listeningRemaining,
    reportListeningCycle,
    refreshHistory,
  } = useQuizAttemptRuntime({ formPublicId, assignmentId });

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

  const sectionList = useMemo((): QuizFormSectionPayload[] => {
    const s = formPayload?.sections;
    return Array.isArray(s) ? (s as QuizFormSectionPayload[]) : [];
  }, [formPayload?.sections]);

  const activeSectionId = useMemo(() => {
    if (!sectionList.length) return null;
    const fromUrl = searchParams.get('section');
    const n = fromUrl ? Number(fromUrl) : NaN;
    if (Number.isFinite(n) && sectionList.some((s) => Number(s.sectionId) === n)) {
      return n;
    }
    if (
      typeof initialSectionId === 'number' &&
      Number.isFinite(initialSectionId) &&
      sectionList.some((s) => Number(s.sectionId) === initialSectionId)
    ) {
      return initialSectionId;
    }
    return Number(sectionList[0].sectionId);
  }, [initialSectionId, searchParams, sectionList]);

  const visibleBlocks = useMemo(
    () => filterRenderableBlocksBySectionId(formPayload, renderBlocks, activeSectionId),
    [activeSectionId, formPayload, renderBlocks],
  );

  const visibleStarts = useMemo(
    () =>
      visibleBlocks.map((vb) => {
        const gi = renderBlocks.findIndex((x) => blocksEqual(x, vb));
        return gi >= 0 ? blockStartIndexes[gi] ?? 0 : 0;
      }),
    [blockStartIndexes, renderBlocks, visibleBlocks],
  );

  const onSectionChange = useCallback(
    (sectionId: number) => {
      if (listeningNavLocked) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', String(sectionId));
      if (questionKey) {
        const targetSec = findSectionIdForAnchorKey(formPayload, renderBlocks, questionKey);
        if (targetSec !== null && targetSec !== sectionId) {
          params.delete('question');
        }
      }
      router.replace(`/quiz-test/${formPublicId}?${params.toString()}`, { scroll: false });
    },
    [formPublicId, formPayload, listeningNavLocked, questionKey, renderBlocks, router, searchParams],
  );

  const navigateToBlock = useCallback(
    (sectionId: number | null, anchorKey: string) => {
      if (listeningNavLocked) {
        const effectiveTarget =
          sectionId != null && Number.isFinite(sectionId)
            ? sectionId
            : findSectionIdForAnchorKey(formPayload, renderBlocks, anchorKey);
        if (
          typeof activeSectionId === 'number' &&
          typeof effectiveTarget === 'number' &&
          effectiveTarget !== activeSectionId
        ) {
          return;
        }
      }
      const params = new URLSearchParams(searchParams.toString());
      if (sectionId != null && Number.isFinite(sectionId)) {
        params.set('section', String(sectionId));
      } else {
        params.delete('section');
      }
      params.set('question', anchorKey);
      router.replace(`/quiz-test/${formPublicId}?${params.toString()}`, { scroll: false });
    },
    [
      activeSectionId,
      formPayload,
      formPublicId,
      listeningNavLocked,
      renderBlocks,
      router,
      searchParams,
    ],
  );

  useEffect(() => {
    if (phase !== 'attempting' || !formPayload) return;
    if (!questionKey) return;
    if (!isAnchorKeyInForm(renderBlocks, questionKey)) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('question');
      const qs = params.toString();
      router.replace(`/quiz-test/${formPublicId}${qs ? `?${qs}` : ''}`, { scroll: false });
      return;
    }
    const targetSec = findSectionIdForAnchorKey(formPayload, renderBlocks, questionKey);
    if (
      targetSec != null &&
      activeSectionId != null &&
      Number.isFinite(targetSec) &&
      targetSec !== activeSectionId
    ) {
      if (listeningNavLocked) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', String(targetSec));
      params.set('question', questionKey);
      router.replace(`/quiz-test/${formPublicId}?${params.toString()}`, { scroll: false });
      return;
    }
    const id = quizAnchorDomId(questionKey);
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [
    activeSectionId,
    formPayload,
    formPublicId,
    listeningNavLocked,
    phase,
    questionKey,
    renderBlocks,
    router,
    searchParams,
  ]);

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
        onRefreshHistory={refreshHistory}
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
      renderBlocks={visibleBlocks}
      blockStartIndexes={visibleStarts}
      onAnswerChange={onAnswerChange}
      onSubmit={handleSubmit}
      submitting={phase === 'submitting'}
      sections={sectionList}
      activeSectionId={activeSectionId}
      onSectionChange={onSectionChange}
      listeningRemaining={listeningRemaining}
      reportListeningCycle={reportListeningCycle}
      allRenderBlocks={renderBlocks}
      activeAnchorKey={questionKey}
      onNavigateToBlock={navigateToBlock}
      onListeningNavLock={setListeningNavLocked}
    />
  );
}

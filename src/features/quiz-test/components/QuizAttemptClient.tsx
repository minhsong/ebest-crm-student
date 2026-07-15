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
  countExpandableQuizBlocks,
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  buildQuizAttemptPagePath,
  buildQuizAttemptPagePathWithoutNav,
  buildMockTestOnlineExamRunPagePath,
  buildMockTestOnlineExamRunPagePathWithoutNav,
  findSectionIdForAnchorKey,
  hasQuizAttemptNavigationParams,
  isAnchorKeyInForm,
  quizAnchorDomId,
  resolveQuizAttemptActiveSectionId,
  scrollQuizAttemptPageToTop,
} from '@/features/quiz-test/lib/quiz-section-navigation';
import { sortQuizFormSections } from '@/features/quiz-test/lib/quiz-section-meta';
import {
  buildBlockStartIndexes,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { useQuizAttemptRuntime } from '@/features/quiz-test/components/useQuizAttemptRuntime';
import { useAssignmentQuizAction } from '@/features/quiz-test/hooks/useAssignmentQuizAction';
import { filterAssignmentAttemptHistoryForDisplay } from '@/features/quiz-test/lib/quiz-attempt-history';
import { useQuizResultViewGate } from '@/features/quiz-test/hooks/useQuizResultViewGate';
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
import { buildQuizAttemptResultHref } from '@/features/quiz-test/lib/quiz-attempt-deadline-close';
import { isMockTestOnlineQuizRuntimeActive } from '@/features/quiz-test/quiz-gateway-browser';
import { shouldAutoNavigateToResultDetail } from '@/features/quiz-test/lib/quiz-attempt-session-lock';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  practiceMode,
  effectiveMaxAttempts,
  initialSummary,
  initialSectionId,
  initialQuestionKey,
  mockTestOnlineEntry,
  mockTestOnlineRuntime,
}: {
  formPublicId: string;
  /** Từ query `?assignmentId=` khi vào đề từ bài tập — đồng bộ điểm sau submit. */
  assignmentId?: number;
  practiceMode?: boolean;
  /** Giới hạn lượt làm (từ authorize) — tránh race với quiz form context. */
  effectiveMaxAttempts?: number | null;
  initialSummary?: QuizPublishedFormSummary | null;
  /** Từ query `?section=` — id section CRM. */
  initialSectionId?: number;
  /** Từ query `?question=` — key thô (formItemId hoặc `parent::child`). */
  initialQuestionKey?: string | null;
  /** Mock test online: lobby = sẵn sàng; session = xác nhận + làm bài. */
  mockTestOnlineEntry?: 'lobby' | 'session';
  /** Mock test online — dùng BFF quiz-runtime public (ưu tiên hơn global prefix). */
  mockTestOnlineRuntime?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listeningNavLocked, setListeningNavLocked] = useState(false);
  const mockTestOnlineActive = isMockTestOnlineQuizRuntimeActive(
    mockTestOnlineRuntime ? 'mock-test-online' : null,
  );
  const isMockLobby = mockTestOnlineActive && mockTestOnlineEntry === 'lobby';
  const isMockSession = mockTestOnlineActive && mockTestOnlineEntry === 'session';
  const confirmStartRequested = searchParams.get('confirm') === '1';
  const mockExamReadyPath = `/mock-test-online/exam/ready?form=${encodeURIComponent(formPublicId)}`;
  const mockExamRunPath = `/mock-test-online/exam/run?form=${encodeURIComponent(formPublicId)}`;

  const buildAttemptPagePath = useCallback(
    (params: URLSearchParams) =>
      mockTestOnlineActive
        ? buildMockTestOnlineExamRunPagePath(formPublicId, params)
        : buildQuizAttemptPagePath(formPublicId, params),
    [formPublicId, mockTestOnlineActive],
  );

  const buildAttemptPagePathWithoutNav = useCallback(
    (params: URLSearchParams) =>
      mockTestOnlineActive
        ? buildMockTestOnlineExamRunPagePathWithoutNav(formPublicId, params)
        : buildQuizAttemptPagePathWithoutNav(formPublicId, params),
    [formPublicId, mockTestOnlineActive],
  );

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
    mtoExpectedScore,
    setMtoExpectedScore,
    mtoSpeakerChecked,
    setMtoSpeakerChecked,
    setPhase,
    loadForm,
    handleStart,
    onAnswerChange,
    handleSubmit,
    openConfirmStart,
    listeningRemaining,
    reportListeningCycle,
    maybeForfeitListeningOnLeaveSection,
    forfeitPriorListeningSections,
    refreshHistory,
    closeReason,
    answersLocked,
    sessionLocked,
  } = useQuizAttemptRuntime({
    formPublicId,
    assignmentId,
    practiceMode,
    mockTestOnlineRuntime,
  });

  const handleOpenConfirmStart = useCallback(() => {
    if (isMockLobby) {
      router.push(`${mockExamRunPath}&confirm=1`);
      return;
    }
    openConfirmStart();
  }, [isMockLobby, mockExamRunPath, openConfirmStart, router]);

  useEffect(() => {
    if (!isMockLobby || phase !== 'attempting') return;
    router.replace(mockExamRunPath);
  }, [isMockLobby, mockExamRunPath, phase, router]);

  /** Run không có ?confirm=1 và chưa mở modal → quay lobby ready. */
  useEffect(() => {
    if (!isMockSession || phase !== 'ready') return;
    if (confirmStartRequested) return;
    router.replace(mockExamReadyPath);
  }, [confirmStartRequested, isMockSession, mockExamReadyPath, phase, router]);

  /** Lobby bấm «Bắt đầu» → run?confirm=1: mở modal xác nhận (phase confirm_start). */
  useEffect(() => {
    if (!isMockSession || !confirmStartRequested || phase !== 'ready') return;
    openConfirmStart();
  }, [confirmStartRequested, isMockSession, openConfirmStart, phase]);

  /** Sau khi đã confirm_start, gỡ ?confirm=1 khỏi URL — tránh redirect về ready. */
  useEffect(() => {
    if (!isMockSession || !confirmStartRequested || phase !== 'confirm_start') return;
    router.replace(mockExamRunPath);
  }, [confirmStartRequested, isMockSession, mockExamRunPath, phase, router]);

  const shouldLoadAssignmentAction =
    assignmentId != null && (phase === 'ready' || phase === 'done');

  const assignmentAction = useAssignmentQuizAction(
    shouldLoadAssignmentAction ? formPublicId : null,
    shouldLoadAssignmentAction ? assignmentId : null,
    effectiveMaxAttempts,
  );

  const assignmentActionForGate = shouldLoadAssignmentAction
    ? assignmentAction
    : {
        loading: false,
        canViewResultDetail: false,
        canViewResults: false,
      };

  useEffect(() => {
    if (phase === 'done' && assignmentId != null) {
      void assignmentAction.reload();
    }
  }, [assignmentId, assignmentAction.reload, phase]);

  useEffect(() => {
    if (phase !== 'done' || !submitResult?.attemptPublicId?.trim()) return;
    if (isMockTestOnlineQuizRuntimeActive()) return;
    if (!shouldAutoNavigateToResultDetail(closeReason)) return;
    router.replace(
      buildQuizAttemptResultHref(formPublicId, submitResult.attemptPublicId.trim()),
    );
  }, [closeReason, formPublicId, phase, router, submitResult?.attemptPublicId]);

  const { allowDetailLinks: allowHistoryDetailLinks } = useQuizResultViewGate(
    formPublicId,
    {
      assignmentId,
      practiceMode,
      assignmentAction: assignmentActionForGate,
    },
  );
  const assignmentHistoryForList = useMemo(() => {
    if (assignmentId == null || assignmentId < 1) return attemptHistory;
    return filterAssignmentAttemptHistoryForDisplay(attemptHistory, assignmentId);
  }, [assignmentId, attemptHistory]);

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
    return Array.isArray(s) ? sortQuizFormSections(s as QuizFormSectionPayload[]) : [];
  }, [formPayload?.sections]);

  const prevSectionIdRef = useRef<number | null>(null);
  const sectionVisitRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<typeof phase>(phase);
  /** Lần làm mới: bỏ qua ?section/?question còn từ attempt trước cho đến khi URL sạch. */
  const [ignoreUrlNav, setIgnoreUrlNav] = useState(false);

  const activeSectionId = useMemo(
    () =>
      resolveQuizAttemptActiveSectionId(sectionList, {
        sectionFromUrl: searchParams.get('section'),
        initialSectionId,
        ignoreUrlNavigation: ignoreUrlNav,
      }),
    [ignoreUrlNav, initialSectionId, searchParams, sectionList],
  );

  const visibleBlocks = useMemo(
    () => filterRenderableBlocksBySectionId(formPayload, renderBlocks, activeSectionId),
    [activeSectionId, formPayload, renderBlocks],
  );

  const quizContentMissing = useMemo(
    () =>
      (phase === 'attempting' || phase === 'submitting') &&
      countExpandableQuizBlocks(formPayload) === 0,
    [formPayload, phase],
  );

  const visibleStarts = useMemo(
    () =>
      visibleBlocks.map((vb) => {
        const gi = renderBlocks.findIndex((x) => blocksEqual(x, vb));
        return gi >= 0 ? blockStartIndexes[gi] ?? 0 : 0;
      }),
    [blockStartIndexes, renderBlocks, visibleBlocks],
  );

  /** Lần làm mới (confirm → starting → attempting) hoặc resume: reset về section đầu. */
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === 'starting') {
      setIgnoreUrlNav(true);
      return;
    }

    const enteredAttemptingFromLoad =
      phase === 'attempting' && prev === 'loading_form';
    const enteredAttemptingFromStart =
      phase === 'attempting' && prev === 'starting';

    if (!enteredAttemptingFromLoad && !enteredAttemptingFromStart) return;

    if (enteredAttemptingFromLoad) {
      setIgnoreUrlNav(true);
      sectionVisitRef.current = null;
    }

    if (enteredAttemptingFromStart) {
      sectionVisitRef.current = null;
    }

    if (hasQuizAttemptNavigationParams(searchParams)) {
      router.replace(buildAttemptPagePathWithoutNav(searchParams), { scroll: false });
    }
    scrollQuizAttemptPageToTop();
  }, [buildAttemptPagePathWithoutNav, phase, router, searchParams]);

  useEffect(() => {
    if (ignoreUrlNav && !hasQuizAttemptNavigationParams(searchParams)) {
      setIgnoreUrlNav(false);
    }
  }, [ignoreUrlNav, searchParams]);

  useEffect(() => {
    if (phase !== 'attempting' && phase !== 'submitting') {
      prevSectionIdRef.current = null;
      sectionVisitRef.current = null;
      return;
    }
    if (activeSectionId == null || !Number.isFinite(activeSectionId)) return;
    if (prevSectionIdRef.current === activeSectionId) return;
    prevSectionIdRef.current = activeSectionId;
    scrollQuizAttemptPageToTop();
  }, [activeSectionId, phase]);

  useEffect(() => {
    if (phase !== 'attempting' && phase !== 'submitting') {
      return;
    }
    if (ignoreUrlNav) return;
    if (activeSectionId == null || !Number.isFinite(activeSectionId)) return;
    if (sectionVisitRef.current === activeSectionId) return;
    sectionVisitRef.current = activeSectionId;
    void forfeitPriorListeningSections(activeSectionId);
  }, [activeSectionId, forfeitPriorListeningSections, ignoreUrlNav, phase]);

  const onSectionChange = useCallback(
    async (sectionId: number) => {
      if (listeningNavLocked) return;
      if (
        typeof activeSectionId === 'number' &&
        Number.isFinite(activeSectionId) &&
        activeSectionId !== sectionId
      ) {
        await maybeForfeitListeningOnLeaveSection(activeSectionId);
      }
      scrollQuizAttemptPageToTop();
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', String(sectionId));
      if (questionKey) {
        const targetSec = findSectionIdForAnchorKey(formPayload, renderBlocks, questionKey);
        if (targetSec !== null && targetSec !== sectionId) {
          params.delete('question');
        }
      }
      router.replace(buildAttemptPagePath(params), { scroll: false });
    },
    [
      activeSectionId,
      buildAttemptPagePath,
      formPayload,
      listeningNavLocked,
      maybeForfeitListeningOnLeaveSection,
      questionKey,
      renderBlocks,
      router,
      searchParams,
    ],
  );

  const navigateToBlock = useCallback(
    async (sectionId: number | null, anchorKey: string) => {
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
      if (
        typeof activeSectionId === 'number' &&
        Number.isFinite(activeSectionId) &&
        sectionId != null &&
        Number.isFinite(sectionId) &&
        sectionId !== activeSectionId
      ) {
        await maybeForfeitListeningOnLeaveSection(activeSectionId);
      }
      const params = new URLSearchParams(searchParams.toString());
      if (sectionId != null && Number.isFinite(sectionId)) {
        params.set('section', String(sectionId));
      } else {
        params.delete('section');
      }
      params.set('question', anchorKey);
      router.replace(buildAttemptPagePath(params), { scroll: false });
    },
    [
      activeSectionId,
      buildAttemptPagePath,
      formPayload,
      listeningNavLocked,
      maybeForfeitListeningOnLeaveSection,
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
      router.replace(buildAttemptPagePath(params), { scroll: false });
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
      router.replace(buildAttemptPagePath(params), { scroll: false });
      return;
    }
    const id = quizAnchorDomId(questionKey);
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [
    activeSectionId,
    buildAttemptPagePath,
    formPayload,
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
    (mockTestOnlineActive ? 'Bài thi thử online' : `Đề (${formPublicId.slice(0, 8)}…)`);


  if (phase === 'loading_form' || phase === 'starting') {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (phase === 'error' || !formPayload) {
    const errorBackHref = mockTestOnlineActive
      ? '/mock-test-online/register'
      : practiceMode
        ? '/learning'
        : '/assignments';
    return (
      <Card>
        <Space direction="vertical" size="middle" className="w-full">
          <Link href={errorBackHref}>
            <Button type="default" size="small" icon={<ArrowLeftOutlined />}>
              {mockTestOnlineActive ? 'Quay lại đăng ký' : 'Danh sách đề'}
            </Button>
          </Link>
          {errMsg ? <Alert type="error" message={errMsg} showIcon /> : null}
          <Button onClick={() => void loadForm()}>Thử lại</Button>
        </Space>
      </Card>
    );
  }

  const backHref = mockTestOnlineActive
    ? '/mock-test-online/register'
    : practiceMode
      ? '/learning'
      : '/assignments';

  if (phase === 'ready') {
    return (
      <QuizAttemptReadySection
        title={title}
        formPublicId={formPublicId}
        formPayload={formPayload}
        formTagKeys={formTagKeys}
        durationSummary={durationSummary}
        backHref={backHref}
        errMsg={errMsg}
        attemptHistory={assignmentHistoryForList}
        onOpenConfirmStart={handleOpenConfirmStart}
        assignmentId={assignmentId}
        canStartNew={
          assignmentId == null || assignmentAction.loading || assignmentAction.canStart
        }
        resultsPageHref={
          assignmentId != null && assignmentAction.canViewResultDetail
            ? assignmentAction.resultsPageHref
            : null
        }
        startBlockReason={assignmentAction.startBlockReason}
        allowHistoryDetailLinks={allowHistoryDetailLinks}
        eligibility={assignmentAction.eligibility}
        mockTestOnlineUi={mockTestOnlineActive}
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
        backHref={backHref}
        errMsg={errMsg}
        rulesAcknowledged={rulesAcknowledged}
        onRulesAcknowledgedChange={setRulesAcknowledged}
        onBack={() => {
          if (isMockSession) {
            router.push(mockExamReadyPath);
            return;
          }
          setPhase('ready');
        }}
        onStart={(opts) => void handleStart(opts)}
        mockTestOnlineUi={mockTestOnlineActive}
        expectedScore={mtoExpectedScore}
        onExpectedScoreChange={setMtoExpectedScore}
        speakerChecked={mtoSpeakerChecked}
        onSpeakerCheckedChange={setMtoSpeakerChecked}
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
        backHref={backHref}
        submitResult={submitResult}
        attemptHistory={assignmentHistoryForList}
        onOpenConfirmStart={handleOpenConfirmStart}
        onRefreshHistory={refreshHistory}
        assignmentId={assignmentId}
        canStartNew={
          assignmentId == null || assignmentAction.loading || assignmentAction.canStart
        }
        resultsPageHref={
          assignmentId != null && assignmentAction.canViewResultDetail
            ? assignmentAction.resultsPageHref
            : null
        }
        allowHistoryDetailLinks={allowHistoryDetailLinks}
        eligibility={assignmentAction.eligibility}
      />
    );
  }

  return (
    <>
      {quizContentMissing ? (
        <Alert
          className="mb-3"
          type="error"
          showIcon
          message="Không tải được nội dung câu hỏi"
          description="Phiên làm bài đã mở nhưng chưa tải được nội dung câu hỏi. Vui lòng tải lại trang hoặc liên hệ giáo vụ nếu lỗi lặp lại."
          action={
            <Button size="small" onClick={() => void loadForm()}>
              Tải lại
            </Button>
          }
        />
      ) : null}
      <QuizAttemptTakingSection
      title={title}
      formPayload={formPayload}
      formTagKeys={formTagKeys}
      backHref={backHref}
      hideBackButton={mockTestOnlineActive}
      errMsg={errMsg}
      attempt={attempt}
      remainingSeconds={remainingSeconds}
      answers={answers}
      renderBlocks={visibleBlocks}
      blockStartIndexes={visibleStarts}
      onAnswerChange={onAnswerChange}
      onSubmit={handleSubmit}
      submitting={phase === 'submitting'}
      answersLocked={answersLocked || sessionLocked}
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
    </>
  );
}

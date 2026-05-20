'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptQuestionBlocks } from '@/features/quiz-test/components/QuizAttemptQuestionBlocks';
import { QuizAttemptSectionToolbar } from '@/features/quiz-test/components/QuizAttemptSectionToolbar';
import { QuizAttemptTakingFooter } from '@/features/quiz-test/components/QuizAttemptTakingFooter';
import { QuizAttemptTimerBar } from '@/features/quiz-test/components/QuizAttemptTimerBar';
import { QuizSectionOutlineDrawer } from '@/features/quiz-test/components/QuizSectionOutlineDrawer';
import { QuizFormMetaBlock } from '@/features/quiz-test/components/QuizFormMetaBlock';
import { QuizSectionListeningOrchestrator } from '@/features/quiz-test/components/QuizSectionListeningOrchestrator';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import { buildSectionListeningQueue } from '@/features/quiz-test/lib/quiz-section-listening-queue';
import { quizAnchorDomId } from '@/features/quiz-test/lib/quiz-section-navigation';
import { quizSectionListeningStorageKey } from '@/features/quiz-test/lib/quiz-section-listening-key';
import { getAttemptTimerValidity } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizPublishedFormPayload, QuizFormSectionPayload, StartAttemptResponse } from '@/features/quiz-test/types';
import { Alert, Button, Card, Space, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type QuizAttemptTakingSectionProps = {
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
  onSubmit: () => void | Promise<void>;
  submitting: boolean;
  sections?: QuizFormSectionPayload[];
  activeSectionId?: number | null;
  onSectionChange?: (sectionId: number) => void;
  listeningRemaining?: Record<string, number>;
  reportListeningCycle?: (formItemKey: string) => Promise<void>;
  allRenderBlocks?: QuizRenderableBlock[];
  activeAnchorKey?: string | null;
  onNavigateToBlock?: (sectionId: number | null, anchorKey: string) => void;
  /** Báo portal khi khóa/mở chuyển phần (URL) vì lượt nghe. */
  onListeningNavLock?: (locked: boolean) => void;
  backHref?: string;
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
  sections,
  activeSectionId,
  onSectionChange,
  listeningRemaining,
  reportListeningCycle,
  allRenderBlocks,
  activeAnchorKey,
  onNavigateToBlock,
  onListeningNavLock,
  backHref,
}: QuizAttemptTakingSectionProps) {
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [listeningHighlightKey, setListeningHighlightKey] = useState<string | null>(null);
  const [listeningNavLocked, setListeningNavLocked] = useState(false);

  // Auto-scroll to the highlighted question when audio is playing
  useEffect(() => {
    if (!listeningHighlightKey) return;
    const el = document.getElementById(quizAnchorDomId(listeningHighlightKey));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [listeningHighlightKey]);

  const showOutline =
    Boolean(onNavigateToBlock) &&
    Array.isArray(allRenderBlocks) &&
    (allRenderBlocks.length > 1 || (sections?.length ?? 0) > 1);

  const timerOk = !!(attempt && getAttemptTimerValidity(attempt).ok);

  const multiSection = Boolean(
    sections && sections.length > 1 && typeof activeSectionId === 'number',
  );

  const handleGoPrevSection = useCallback(() => {
    if (listeningNavLocked) return;
    if (!sections?.length || typeof activeSectionId !== 'number') return;
    const idx = sections.findIndex((s) => s.sectionId === activeSectionId);
    const prev = idx > 0 ? sections[idx - 1] : null;
    if (prev) onSectionChange?.(prev.sectionId);
  }, [activeSectionId, listeningNavLocked, onSectionChange, sections]);

  const handleGoNextSection = useCallback(() => {
    if (listeningNavLocked) return;
    if (!sections?.length || typeof activeSectionId !== 'number') return;
    const idx = sections.findIndex((s) => s.sectionId === activeSectionId);
    const next = idx >= 0 && idx < sections.length - 1 ? sections[idx + 1] : null;
    if (next) onSectionChange?.(next.sectionId);
  }, [activeSectionId, listeningNavLocked, onSectionChange, sections]);

  const effectiveListeningSectionId =
    typeof activeSectionId === 'number' && Number.isFinite(activeSectionId)
      ? activeSectionId
      : 0;

  const sectionListeningStorageKeyStr = quizSectionListeningStorageKey(effectiveListeningSectionId);

  const queueHasListening = useMemo(
    () => buildSectionListeningQueue(renderBlocks).length > 0,
    [renderBlocks],
  );

  const hasSectionListeningQuota =
    typeof listeningRemaining?.[sectionListeningStorageKeyStr] === 'number';

  const useSectionListeningPlayer =
    queueHasListening && hasSectionListeningQuota && !!reportListeningCycle;

  useEffect(() => {
    if (!useSectionListeningPlayer) {
      setListeningNavLocked(false);
      setListeningHighlightKey(null);
      onListeningNavLock?.(false);
    }
  }, [useSectionListeningPlayer, onListeningNavLock]);

  const handleListeningNavLock = useCallback(
    (locked: boolean) => {
      setListeningNavLocked(locked);
      onListeningNavLock?.(locked);
    },
    [onListeningNavLock],
  );

  return (
    <Card styles={{ body: { padding: 0 } }}>
      {timerOk ? <QuizAttemptTimerBar remainingSeconds={remainingSeconds} /> : null}

      <div className="flex flex-col gap-3 px-4 pb-4 pt-4 md:px-6">
        <Link href={backHref ?? '/assignments'}>
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Quay lại
          </Button>
        </Link>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <QuizFormMetaBlock
          compact
          formType={formPayload.type ?? null}
          catalogKey={formPayload.catalogKey ?? null}
          catalogPath={formPayload.catalogPath ?? null}
          tagKeys={formTagKeys}
        />
      </div>

      {errMsg ? (
        <div className="px-4 md:px-6">
          <Alert className="mb-4" type="warning" message={errMsg} showIcon />
        </div>
      ) : null}

      <QuizAttemptSectionToolbar
        multiSection={multiSection}
        showOutline={showOutline}
        outlineOpen={outlineOpen}
        sections={sections}
        activeSectionId={activeSectionId ?? null}
        onToggleOutline={() => setOutlineOpen((v) => !v)}
      />

      {showOutline && allRenderBlocks && onNavigateToBlock ? (
        <QuizSectionOutlineDrawer
          open={outlineOpen}
          onClose={() => setOutlineOpen(false)}
          formPayload={formPayload}
          allRenderBlocks={allRenderBlocks}
          activeSectionId={activeSectionId ?? null}
          activeAnchorKey={activeAnchorKey ?? null}
          onNavigateToBlock={onNavigateToBlock}
          navigationLocked={listeningNavLocked}
          lockedSectionId={activeSectionId ?? null}
        />
      ) : null}

      <Space direction="vertical" size="large" className="w-full px-4 pb-6 md:px-6">
        {useSectionListeningPlayer ? (
          <QuizSectionListeningOrchestrator
            key={sectionListeningStorageKeyStr}
            sectionId={effectiveListeningSectionId}
            renderBlocks={renderBlocks}
            listeningRemaining={listeningRemaining ?? {}}
            reportListeningCycle={reportListeningCycle!}
            onHighlightKeyChange={setListeningHighlightKey}
            onNavLockChange={handleListeningNavLock}
          />
        ) : null}
        <QuizAttemptQuestionBlocks
          renderBlocks={renderBlocks}
          blockStartIndexes={blockStartIndexes}
          answers={answers}
          readOnly={false}
          onAnswerChange={onAnswerChange}
          listeningRemaining={listeningRemaining}
          reportListeningCycle={reportListeningCycle}
          listeningHighlightKey={listeningHighlightKey}
          embedListeningPlayer={!useSectionListeningPlayer}
        />
      </Space>

      <QuizAttemptTakingFooter
        submitting={submitting}
        onSubmit={onSubmit}
        sections={sections}
        activeSectionId={activeSectionId}
        onGoPrevSection={handleGoPrevSection}
        onGoNextSection={handleGoNextSection}
        listeningNavLocked={listeningNavLocked}
      />
    </Card>
  );
}

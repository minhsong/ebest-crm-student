'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QuizAttemptQuestionBlocks } from '@/features/quiz-test/components/QuizAttemptQuestionBlocks';
import { QuizAttemptSectionToolbar } from '@/features/quiz-test/components/QuizAttemptSectionToolbar';
import { QuizSectionInstructionsBlock } from '@/features/quiz-test/components/QuizSectionInstructionsBlock';
import { QuizAttemptTakingFooter } from '@/features/quiz-test/components/QuizAttemptTakingFooter';
import { QuizAttemptStickyStatusBar } from '@/features/quiz-test/components/QuizAttemptStickyStatusBar';
import { QuizSectionOutlineDrawer } from '@/features/quiz-test/components/QuizSectionOutlineDrawer';
import { QuizFormMetaBlock } from '@/features/quiz-test/components/QuizFormMetaBlock';
import { QuizSectionListeningOrchestrator } from '@/features/quiz-test/components/QuizSectionListeningOrchestrator';
import { useSectionListeningTaking } from '@/features/quiz-test/hooks/useSectionListeningTaking';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import { quizAnchorDomId } from '@/features/quiz-test/lib/quiz-section-navigation';
import { getAttemptTimerValidity } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizPublishedFormPayload, QuizFormSectionPayload, StartAttemptResponse } from '@/features/quiz-test/types';
import { Alert, Button, Card, Space, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  reportListeningCycle?: (formItemKey: string) => Promise<boolean>;
  startManualListeningSection?: (sectionId: number) => void;
  isManualListeningSectionStarted?: (sectionId: number) => boolean;
  allRenderBlocks?: QuizRenderableBlock[];
  activeAnchorKey?: string | null;
  onNavigateToBlock?: (sectionId: number | null, anchorKey: string) => void;
  onListeningNavLock?: (locked: boolean) => void;
  backHref?: string;
  answersLocked?: boolean;
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
  startManualListeningSection,
  isManualListeningSectionStarted,
  allRenderBlocks,
  activeAnchorKey,
  onNavigateToBlock,
  onListeningNavLock,
  backHref,
  answersLocked = false,
}: QuizAttemptTakingSectionProps) {
  const [outlineOpen, setOutlineOpen] = useState(true);

  const listening = useSectionListeningTaking({
    formPayload,
    sections,
    activeSectionId,
    renderBlocks,
    listeningRemaining,
    reportListeningCycle,
    startManualListeningSection,
    isManualListeningSectionStarted,
    onSectionChange,
    onListeningNavLock,
  });

  useEffect(() => {
    if (!listening.listeningHighlightKey) return;
    const el = document.getElementById(quizAnchorDomId(listening.listeningHighlightKey));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [listening.listeningHighlightKey]);

  const showOutline =
    Boolean(onNavigateToBlock) &&
    Array.isArray(allRenderBlocks) &&
    (allRenderBlocks.length > 1 || (sections?.length ?? 0) > 1);

  const timerOk = !!(attempt && getAttemptTimerValidity(attempt).ok);

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <QuizAttemptStickyStatusBar
        showTimer={timerOk}
        remainingSeconds={remainingSeconds}
        listeningRemainingPlays={
          listening.useSectionListeningPlayer
            ? listening.sectionListeningRemaining ?? 0
            : null
        }
        listeningAutoStartCountdown={listening.listeningAutoStartCountdown}
        listeningPlaybackBusy={listening.listeningPlaybackBusy}
        showManualListenButton={listening.showManualListenButton}
        onManualListenStart={listening.handleManualPlaybackStart}
      />

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
          tagKeys={formTagKeys}
        />
      </div>

      {answersLocked ? (
        <div className="px-4 md:px-6">
          <Alert
            className="mb-4"
            type="info"
            showIcon
            message="Phiên làm bài đã kết thúc"
            description="Hệ thống đang nộp bài và chuyển sang trang kết quả. Bạn không thể chỉnh sửa đáp án."
          />
        </div>
      ) : null}

      {errMsg ? (
        <div className="px-4 md:px-6">
          <Alert className="mb-4" type="warning" message={errMsg} showIcon />
        </div>
      ) : null}

      <QuizAttemptSectionToolbar
        showOutline={showOutline}
        outlineOpen={outlineOpen}
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
          navigationLocked={listening.listeningNavLocked}
          lockedSectionId={activeSectionId ?? null}
        />
      ) : null}

      <Space direction="vertical" size="large" className="w-full px-4 pb-6 md:px-6">
        <QuizSectionInstructionsBlock
          section={listening.activeSectionMeta}
          sectionHeading={listening.sectionInstructionsHeading}
        />
        {listening.useSectionListeningPlayer ? (
          <QuizSectionListeningOrchestrator
            key={listening.sectionStorageKey}
            sectionId={listening.effectiveSectionId}
            renderBlocks={renderBlocks}
            listeningRemaining={listeningRemaining ?? {}}
            sectionQuotaMax={listening.sectionListeningQuotaMax}
            playbackMode={listening.sectionPlaybackMode}
            manualPlaybackStarted={listening.manualPlaybackStarted}
            reportListeningCycle={reportListeningCycle!}
            onHighlightKeyChange={listening.setListeningHighlightKey}
            onLocksChange={listening.handleListeningLocksChange}
            onPlaybackBusyChange={listening.setListeningPlaybackBusy}
            onAutoStartCountdownChange={listening.setListeningAutoStartCountdown}
          />
        ) : null}
        <QuizAttemptQuestionBlocks
          renderBlocks={renderBlocks}
          blockStartIndexes={blockStartIndexes}
          answers={answers}
          readOnly={answersLocked}
          onAnswerChange={answersLocked ? undefined : onAnswerChange}
          listeningRemaining={listeningRemaining}
          reportListeningCycle={reportListeningCycle}
          listeningHighlightKey={listening.listeningHighlightKey}
          embedListeningPlayer={!listening.useSectionListeningPlayer}
        />
      </Space>

      <QuizAttemptTakingFooter
        submitting={submitting || answersLocked}
        onSubmit={answersLocked ? () => undefined : onSubmit}
        sections={sections}
        activeSectionId={activeSectionId}
        onGoPrevSection={listening.handleGoPrevSection}
        onGoNextSection={listening.handleGoNextSection}
        listeningNavLocked={listening.listeningNavLocked}
        listeningSubmitLocked={listening.listeningSubmitLocked}
      />
    </Card>
  );
}

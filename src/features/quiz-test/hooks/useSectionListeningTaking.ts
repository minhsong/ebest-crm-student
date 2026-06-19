'use client';

import { buildSectionListeningQueue } from '@/features/quiz-test/lib/quiz-section-listening-queue';
import {
  getSectionListeningQuotaFromForm,
  isKnownListeningRemaining,
  quizSectionListeningStorageKey,
  resolveSectionPlaybackModeFromForm,
  type SectionPlaybackMode,
} from '@/features/quiz-test/lib/quiz-listening-rules';
import type { SectionListeningLocks } from '@/features/quiz-test/lib/quiz-section-listening-locks';
import {
  findQuizFormSection,
  formatSectionInstructionsHeading,
  getAdjacentSectionId,
} from '@/features/quiz-test/lib/quiz-section-meta';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import type { QuizFormSectionPayload, QuizPublishedFormPayload } from '@/features/quiz-test/types';
import type {
  QuizListeningPlaybackGate,
  QuizSectionListeningOrchestratorHandle,
} from '@/features/quiz-test/components/QuizSectionListeningOrchestrator';
import { unlockQuizAudioSession } from '@/features/quiz-test/lib/quiz-audio-session';
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react';

type Args = {
  formPayload: QuizPublishedFormPayload;
  sections?: QuizFormSectionPayload[];
  activeSectionId?: number | null;
  renderBlocks: QuizRenderableBlock[];
  listeningRemaining?: Record<string, number>;
  reportListeningCycle?: (formItemKey: string) => Promise<boolean>;
  onSectionChange?: (sectionId: number) => void;
  onListeningNavLock?: (locked: boolean) => void;
  listenOrchestratorRef?: RefObject<QuizSectionListeningOrchestratorHandle | null>;
};

export function useSectionListeningTaking({
  formPayload,
  sections,
  activeSectionId,
  renderBlocks,
  listeningRemaining,
  reportListeningCycle,
  onSectionChange,
  onListeningNavLock,
  listenOrchestratorRef,
}: Args) {
  const [listeningHighlightKey, setListeningHighlightKey] = useState<string | null>(null);
  const [listeningNavLocked, setListeningNavLocked] = useState(false);
  const [listeningSubmitLocked, setListeningSubmitLocked] = useState(false);
  const [listeningPlaybackBusy, setListeningPlaybackBusy] = useState(false);
  const [listeningAutoStartCountdown, setListeningAutoStartCountdown] = useState<
    number | null
  >(null);
  const [listeningInterRoundCountdown, setListeningInterRoundCountdown] = useState<
    number | null
  >(null);
  const [listeningPlaybackGate, setListeningPlaybackGate] =
    useState<QuizListeningPlaybackGate | null>(null);

  const effectiveSectionId =
    typeof activeSectionId === 'number' && Number.isFinite(activeSectionId)
      ? activeSectionId
      : 0;

  const activeSectionMeta = useMemo(
    () => findQuizFormSection(sections, activeSectionId ?? null),
    [activeSectionId, sections],
  );

  const sectionStorageKey = quizSectionListeningStorageKey(effectiveSectionId);

  const queueHasListening = useMemo(
    () => buildSectionListeningQueue(renderBlocks).length > 0,
    [renderBlocks],
  );

  const hasSectionListeningQuota = isKnownListeningRemaining(
    listeningRemaining?.[sectionStorageKey],
  );

  const useSectionListeningPlayer =
    queueHasListening && hasSectionListeningQuota && !!reportListeningCycle;

  const sectionListeningQuotaMax = useMemo(
    () => getSectionListeningQuotaFromForm(formPayload, effectiveSectionId),
    [formPayload, effectiveSectionId],
  );

  const sectionPlaybackMode: SectionPlaybackMode = useMemo(() => {
    return resolveSectionPlaybackModeFromForm(formPayload, effectiveSectionId) ?? 'auto';
  }, [formPayload, effectiveSectionId]);

  const sectionListeningRemaining = listeningRemaining?.[sectionStorageKey];

  const showOnDemandListenButton =
    useSectionListeningPlayer &&
    sectionPlaybackMode === 'on_demand' &&
    typeof sectionListeningRemaining === 'number' &&
    sectionListeningRemaining > 0 &&
    !listeningPlaybackBusy;

  const sectionInstructionsHeading = useMemo(
    () => formatSectionInstructionsHeading(sections, activeSectionId ?? null),
    [activeSectionId, sections],
  );

  useEffect(() => {
    if (!useSectionListeningPlayer) {
      setListeningNavLocked(false);
      setListeningSubmitLocked(false);
      setListeningHighlightKey(null);
      setListeningPlaybackBusy(false);
      setListeningAutoStartCountdown(null);
      setListeningInterRoundCountdown(null);
      setListeningPlaybackGate(null);
      onListeningNavLock?.(false);
    }
  }, [onListeningNavLock, useSectionListeningPlayer]);

  const handleOnDemandListenStart = useCallback(() => {
    void unlockQuizAudioSession();
    void listenOrchestratorRef?.current?.startFromUserGesture();
  }, [listenOrchestratorRef]);

  const handleListeningLocksChange = useCallback(
    ({ navLocked, submitLocked }: SectionListeningLocks) => {
      setListeningNavLocked(navLocked);
      setListeningSubmitLocked(submitLocked);
      onListeningNavLock?.(navLocked);
    },
    [onListeningNavLock],
  );

  const handleListeningPlaybackGateChange = useCallback(
    (gate: QuizListeningPlaybackGate | null) => {
      setListeningPlaybackGate(gate);
    },
    [],
  );

  const handleListeningPlaybackConfirm = useCallback(() => {
    listeningPlaybackGate?.confirmPlayback();
  }, [listeningPlaybackGate]);

  const navigateSection = useCallback(
    (direction: 'prev' | 'next') => {
      if (listeningNavLocked) return;
      if (typeof activeSectionId !== 'number') return;
      const nextId = getAdjacentSectionId(sections, activeSectionId, direction);
      if (nextId != null) onSectionChange?.(nextId);
    },
    [activeSectionId, listeningNavLocked, onSectionChange, sections],
  );

  const handleGoPrevSection = useCallback(() => {
    navigateSection('prev');
  }, [navigateSection]);

  const handleGoNextSection = useCallback(() => {
    navigateSection('next');
  }, [navigateSection]);

  return {
    activeSectionMeta,
    sectionInstructionsHeading,
    sectionStorageKey,
    effectiveSectionId,
    useSectionListeningPlayer,
    sectionListeningQuotaMax,
    sectionPlaybackMode,
    sectionListeningRemaining,
    showOnDemandListenButton,
    handleOnDemandListenStart,
    listeningHighlightKey,
    setListeningHighlightKey,
    listeningNavLocked,
    listeningSubmitLocked,
    listeningPlaybackBusy,
    setListeningPlaybackBusy,
    listeningAutoStartCountdown,
    setListeningAutoStartCountdown,
    listeningInterRoundCountdown,
    setListeningInterRoundCountdown,
    listeningPlaybackGate,
    handleListeningPlaybackGateChange,
    handleListeningPlaybackConfirm,
    handleListeningLocksChange,
    handleGoPrevSection,
    handleGoNextSection,
  };
}

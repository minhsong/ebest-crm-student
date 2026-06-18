'use client';

import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  computeSectionListeningLocks,
  type SectionListeningLocks,
} from '@/features/quiz-test/lib/quiz-section-listening-locks';
import {
  isKnownListeningRemaining,
  SECTION_LISTENING_INTER_ROUND_COUNTDOWN_SECONDS,
  quizSectionListeningStorageKey,
  type SectionPlaybackMode,
} from '@/features/quiz-test/lib/quiz-listening-rules';
import { flattenSectionListeningQueue } from '@/features/quiz-test/lib/quiz-section-listening-queue';
import { useSectionListeningAutoStartCountdown } from '@/features/quiz-test/hooks/useSectionListeningAutoStartCountdown';
import { useSecondsCountdown } from '@/features/quiz-test/hooks/useSecondsCountdown';
import {
  isQuizAudioSessionUnlocked,
  unlockQuizAudioSession,
} from '@/features/quiz-test/lib/quiz-audio-session';
import type { QuizListeningPlaybackGateReason } from '@/features/quiz-test/components/QuizListeningPlaybackConfirmModal';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type QuizListeningPlaybackGate = {
  open: boolean;
  reason: QuizListeningPlaybackGateReason;
  confirmPlayback: () => void;
};

export type QuizSectionListeningOrchestratorProps = {
  sectionId: number;
  renderBlocks: QuizRenderableBlock[];
  listeningRemaining: Record<string, number>;
  sectionQuotaMax?: number | null;
  playbackMode: SectionPlaybackMode;
  manualPlaybackStarted: boolean;
  reportListeningCycle: (formItemKey: string) => Promise<boolean>;
  onHighlightKeyChange: (key: string | null) => void;
  onLocksChange: (locks: SectionListeningLocks) => void;
  onPlaybackBusyChange?: (busy: boolean) => void;
  onAutoStartCountdownChange?: (seconds: number | null) => void;
  onInterRoundCountdownChange?: (seconds: number | null) => void;
  onPlaybackGateChange?: (gate: QuizListeningPlaybackGate | null) => void;
};

/**
 * Player playlist section — quota `section:<id>`. UI lượt nghe/timer ở sticky bar.
 */
export function QuizSectionListeningOrchestrator({
  sectionId,
  renderBlocks,
  listeningRemaining,
  sectionQuotaMax,
  playbackMode,
  manualPlaybackStarted,
  reportListeningCycle,
  onHighlightKeyChange,
  onLocksChange,
  onPlaybackBusyChange,
  onAutoStartCountdownChange,
  onInterRoundCountdownChange,
  onPlaybackGateChange,
}: QuizSectionListeningOrchestratorProps) {
  const flat = useMemo(
    () => flattenSectionListeningQueue(renderBlocks),
    [renderBlocks],
  );
  const sectionKey = quizSectionListeningStorageKey(sectionId);
  const sectionRem = listeningRemaining[sectionKey];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [segIndex, setSegIndex] = useState(0);
  const [roundGeneration, setRoundGeneration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playbackConfirmed, setPlaybackConfirmed] = useState(() =>
    isQuizAudioSessionUnlocked(),
  );
  const needsUserGestureRef = useRef(false);
  const [playbackBusy, setPlaybackBusy] = useState(false);
  const [localCyclesCompleted, setLocalCyclesCompleted] = useState(0);
  const [interRoundGeneration, setInterRoundGeneration] = useState(0);
  const [interRoundPending, setInterRoundPending] = useState(false);
  const roundClosedRef = useRef(false);
  const reportRef = useRef(reportListeningCycle);
  reportRef.current = reportListeningCycle;
  const highlightRef = useRef(onHighlightKeyChange);
  highlightRef.current = onHighlightKeyChange;
  const locksRef = useRef(onLocksChange);
  locksRef.current = onLocksChange;
  const gateChangeRef = useRef(onPlaybackGateChange);
  gateChangeRef.current = onPlaybackGateChange;
  const interRoundChangeRef = useRef(onInterRoundCountdownChange);
  interRoundChangeRef.current = onInterRoundCountdownChange;

  const hasQueue = flat.length > 0;
  const hasServerQuota = isKnownListeningRemaining(sectionRem);

  const autoCountdownEnabled =
    playbackMode === 'auto' && playbackConfirmed && hasQueue && hasServerQuota;

  const { inCountdown: inAutoStartCountdown } = useSectionListeningAutoStartCountdown({
    sectionKey,
    enabled: autoCountdownEnabled,
    hasQueue,
    hasServerQuota,
    sectionRem: hasServerQuota ? sectionRem : 0,
    onCountdownChange: onAutoStartCountdownChange,
  });

  const { inCountdown: inInterRoundCountdown } = useSecondsCountdown({
    enabled: interRoundPending,
    generation: interRoundGeneration,
    totalSeconds: SECTION_LISTENING_INTER_ROUND_COUNTDOWN_SECONDS,
    onTick: (s) => interRoundChangeRef.current?.(s),
  });

  const inCountdown = inAutoStartCountdown || inInterRoundCountdown;

  const playbackGateOpen =
    playbackMode === 'auto' &&
    hasQueue &&
    hasServerQuota &&
    sectionRem > 0 &&
    (!playbackConfirmed || autoplayBlocked);

  const playbackStarted =
    playbackMode === 'manual'
      ? manualPlaybackStarted
      : playbackMode === 'auto' && playbackConfirmed && !inAutoStartCountdown;

  const active =
    hasQueue &&
    hasServerQuota &&
    sectionRem > 0 &&
    playbackStarted &&
    !inInterRoundCountdown &&
    !playbackGateOpen;

  const startSegmentPlayback = useCallback(() => {
    const el = audioRef.current;
    if (!el) return Promise.resolve(false);
    const seg = flat[segIndex];
    if (!seg?.url) return Promise.resolve(false);
    el.src = seg.url;
    const p = el.play();
    if (!p || typeof p.then !== 'function') {
      setAutoplayBlocked(false);
      needsUserGestureRef.current = false;
      return Promise.resolve(true);
    }
    return p
      .then(() => {
        needsUserGestureRef.current = false;
        setAutoplayBlocked(false);
        return true;
      })
      .catch(() => {
        needsUserGestureRef.current = true;
        setAutoplayBlocked(true);
        return false;
      });
  }, [flat, segIndex]);

  const startSegmentPlaybackRef = useRef(startSegmentPlayback);
  startSegmentPlaybackRef.current = startSegmentPlayback;

  const confirmSectionPlayback = useCallback(() => {
    void unlockQuizAudioSession();
    setPlaybackConfirmed(true);
    needsUserGestureRef.current = false;
    setAutoplayBlocked((blocked) => {
      if (blocked) {
        void startSegmentPlaybackRef.current();
      }
      return false;
    });
  }, []);

  const confirmSectionPlaybackRef = useRef(confirmSectionPlayback);
  confirmSectionPlaybackRef.current = confirmSectionPlayback;

  useEffect(() => {
    if (!playbackGateOpen) {
      gateChangeRef.current?.(null);
      return;
    }
    gateChangeRef.current?.({
      open: true,
      reason: !playbackConfirmed ? 'section-start' : 'autoplay-blocked',
      confirmPlayback: () => confirmSectionPlaybackRef.current(),
    });
  }, [playbackGateOpen, playbackConfirmed]);

  useEffect(() => {
    setLocalCyclesCompleted(0);
    setRoundGeneration(0);
    setSegIndex(0);
    setInterRoundPending(false);
    setInterRoundGeneration(0);
    setAutoplayBlocked(false);
    needsUserGestureRef.current = false;
    setPlaybackConfirmed(isQuizAudioSessionUnlocked());
    roundClosedRef.current = false;
    gateChangeRef.current?.(null);
    interRoundChangeRef.current?.(null);
  }, [sectionKey]);

  useEffect(() => {
    return () => {
      locksRef.current({ navLocked: false, submitLocked: false });
      highlightRef.current(null);
      onPlaybackBusyChange?.(false);
      gateChangeRef.current?.(null);
      interRoundChangeRef.current?.(null);
    };
  }, [onPlaybackBusyChange]);

  useEffect(() => {
    if (!hasQueue || !hasServerQuota) {
      locksRef.current({ navLocked: false, submitLocked: false });
      highlightRef.current(null);
      return;
    }
    locksRef.current(
      computeSectionListeningLocks({
        hasQueue,
        hasServerQuota,
        sectionRem,
        sectionQuotaMax,
        localCyclesCompleted,
        playbackBusy: playbackBusy || inCountdown || playbackGateOpen,
      }),
    );
  }, [
    hasQueue,
    hasServerQuota,
    sectionRem,
    sectionQuotaMax,
    localCyclesCompleted,
    playbackBusy,
    inCountdown,
    playbackGateOpen,
  ]);

  useEffect(() => {
    onPlaybackBusyChange?.(playbackBusy || inCountdown || playbackGateOpen);
  }, [onPlaybackBusyChange, playbackBusy, inCountdown, playbackGateOpen]);

  const resetRound = useCallback(() => {
    roundClosedRef.current = false;
    setSegIndex(0);
    setAutoplayBlocked(false);
    needsUserGestureRef.current = false;
    setRoundGeneration((g) => g + 1);
  }, []);

  const prevRemRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!hasQueue) return;
    if (prevRemRef.current !== sectionRem) {
      prevRemRef.current = sectionRem;
      resetRound();
    }
  }, [hasQueue, sectionRem, resetRound]);

  useEffect(() => {
    if (!interRoundPending) return;
    if (inInterRoundCountdown) return;
    setInterRoundPending(false);
    interRoundChangeRef.current?.(null);
  }, [interRoundPending, inInterRoundCountdown]);

  const completePlaylistRound = useCallback(() => {
    if (roundClosedRef.current) return;
    roundClosedRef.current = true;
    highlightRef.current(null);
    const remBefore = sectionRem;
    setLocalCyclesCompleted((n) => n + 1);
    void (async () => {
      try {
        const ok = await reportRef.current(sectionKey);
        if (!ok) {
          roundClosedRef.current = false;
          setLocalCyclesCompleted((n) => Math.max(0, n - 1));
          resetRound();
          setPlaybackBusy(false);
          return;
        }
        if (remBefore - 1 > 0) {
          setInterRoundPending(true);
          setInterRoundGeneration((g) => g + 1);
          setPlaybackBusy(true);
        } else {
          setPlaybackBusy(false);
        }
      } catch {
        roundClosedRef.current = false;
        setLocalCyclesCompleted((n) => Math.max(0, n - 1));
        resetRound();
        setPlaybackBusy(false);
      }
    })();
  }, [resetRound, sectionKey, sectionRem]);

  useEffect(() => {
    if (!active) {
      if (!inInterRoundCountdown && !playbackGateOpen) {
        highlightRef.current(null);
      }
      if (!inInterRoundCountdown && !playbackGateOpen) {
        setPlaybackBusy(false);
      }
      return;
    }
    setPlaybackBusy(true);
    const seg = flat[segIndex];
    if (!seg) {
      highlightRef.current(null);
      setPlaybackBusy(false);
      return;
    }
    highlightRef.current(seg.highlightKey);
    if (needsUserGestureRef.current) {
      return;
    }
    void startSegmentPlayback();
    return () => {
      audioRef.current?.pause();
    };
  }, [
    active,
    flat,
    segIndex,
    roundGeneration,
    startSegmentPlayback,
    inInterRoundCountdown,
    playbackGateOpen,
  ]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !active) return;

    const advanceOrComplete = () => {
      if (segIndex < flat.length - 1) {
        setSegIndex((i) => i + 1);
        return;
      }
      completePlaylistRound();
    };

    const onEnded = () => advanceOrComplete();
    const onError = () => advanceOrComplete();

    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [active, completePlaylistRound, flat.length, segIndex]);

  if (!hasQueue || !hasServerQuota) {
    return null;
  }

  return (
    <audio ref={audioRef} preload="auto" className="sr-only h-0 w-0" aria-hidden playsInline />
  );
}

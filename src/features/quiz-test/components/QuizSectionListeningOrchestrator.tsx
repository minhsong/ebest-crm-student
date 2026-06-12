'use client';

import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  computeSectionListeningLocks,
  type SectionListeningLocks,
} from '@/features/quiz-test/lib/quiz-section-listening-locks';
import {
  isKnownListeningRemaining,
  quizSectionListeningStorageKey,
  type SectionPlaybackMode,
} from '@/features/quiz-test/lib/quiz-listening-rules';
import { flattenSectionListeningQueue } from '@/features/quiz-test/lib/quiz-section-listening-queue';
import { useSectionListeningAutoStartCountdown } from '@/features/quiz-test/hooks/useSectionListeningAutoStartCountdown';
import { Alert } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const [playbackBusy, setPlaybackBusy] = useState(false);
  const [localCyclesCompleted, setLocalCyclesCompleted] = useState(0);
  const roundClosedRef = useRef(false);
  const reportRef = useRef(reportListeningCycle);
  reportRef.current = reportListeningCycle;
  const highlightRef = useRef(onHighlightKeyChange);
  highlightRef.current = onHighlightKeyChange;
  const locksRef = useRef(onLocksChange);
  locksRef.current = onLocksChange;

  const hasQueue = flat.length > 0;
  const hasServerQuota = isKnownListeningRemaining(sectionRem);

  const { inCountdown: inAutoStartCountdown } = useSectionListeningAutoStartCountdown({
    sectionKey,
    enabled: playbackMode === 'auto',
    hasQueue,
    hasServerQuota,
    sectionRem: hasServerQuota ? sectionRem : 0,
    onCountdownChange: onAutoStartCountdownChange,
  });

  const playbackStarted =
    playbackMode === 'manual'
      ? manualPlaybackStarted
      : playbackMode === 'auto' && !inAutoStartCountdown;

  const active =
    hasQueue && hasServerQuota && sectionRem > 0 && playbackStarted;

  useEffect(() => {
    setLocalCyclesCompleted(0);
    setRoundGeneration(0);
    setSegIndex(0);
    roundClosedRef.current = false;
  }, [sectionKey]);

  useEffect(() => {
    return () => {
      locksRef.current({ navLocked: false, submitLocked: false });
      highlightRef.current(null);
      onPlaybackBusyChange?.(false);
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
        playbackBusy: playbackBusy || inAutoStartCountdown,
      }),
    );
  }, [
    hasQueue,
    hasServerQuota,
    sectionRem,
    sectionQuotaMax,
    localCyclesCompleted,
    playbackBusy,
    inAutoStartCountdown,
  ]);

  useEffect(() => {
    onPlaybackBusyChange?.(playbackBusy);
  }, [onPlaybackBusyChange, playbackBusy]);

  const resetRound = useCallback(() => {
    roundClosedRef.current = false;
    setSegIndex(0);
    setAutoplayBlocked(false);
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

  const completePlaylistRound = useCallback(() => {
    if (roundClosedRef.current) return;
    roundClosedRef.current = true;
    highlightRef.current(null);
    setLocalCyclesCompleted((n) => n + 1);
    void (async () => {
      try {
        const ok = await reportRef.current(sectionKey);
        if (!ok) {
          roundClosedRef.current = false;
          setLocalCyclesCompleted((n) => Math.max(0, n - 1));
          resetRound();
        }
      } finally {
        setPlaybackBusy(false);
      }
    })();
  }, [resetRound, sectionKey]);

  useEffect(() => {
    if (!active) {
      highlightRef.current(null);
      setPlaybackBusy(false);
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
    const el = audioRef.current;
    if (!el) return;
    el.src = seg.url;
    const p = el.play();
    if (p && typeof p.then === 'function') {
      void p.then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
    }
    return () => {
      el.pause();
    };
  }, [active, flat, segIndex, roundGeneration]);

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
    <>
      <audio ref={audioRef} preload="auto" className="sr-only h-0 w-0" aria-hidden />
      {autoplayBlocked ? (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="Âm thanh chưa phát được"
          description="Trình duyệt có thể chặn tự phát. Thử tương tác nhẹ với trang hoặc kiểm tra quyền âm thanh."
        />
      ) : null}
    </>
  );
}

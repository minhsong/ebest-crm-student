"use client";

import type { QuizRenderableBlock } from "@/features/quiz-test/lib/quiz-renderable-items";

import {
  computeSectionListeningLocks,
  type SectionListeningLocks,
} from "@/features/quiz-test/lib/quiz-section-listening-locks";

import {
  isKnownListeningRemaining,
  SECTION_LISTENING_INTER_ROUND_COUNTDOWN_SECONDS,
  quizSectionListeningStorageKey,
  type SectionPlaybackMode,
} from "@/features/quiz-test/lib/quiz-listening-rules";

import { flattenSectionListeningQueue } from "@/features/quiz-test/lib/quiz-section-listening-queue";

import { useSectionListeningAutoStartCountdown } from "@/features/quiz-test/hooks/useSectionListeningAutoStartCountdown";

import { useSecondsCountdown } from "@/features/quiz-test/hooks/useSecondsCountdown";

import {
  isQuizAudioSessionUnlocked,
  unlockQuizAudioSession,
} from "@/features/quiz-test/lib/quiz-audio-session";

import type { QuizListeningPlaybackGateReason } from "@/features/quiz-test/components/QuizListeningPlaybackConfirmModal";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export type QuizListeningPlaybackGate = {
  open: boolean;

  reason: QuizListeningPlaybackGateReason;

  confirmPlayback: () => void;
};

export type QuizSectionListeningOrchestratorHandle = {
  /** Gọi trong handler click «Nghe» (on_demand) — phát ngay trong user gesture. */

  startFromUserGesture: () => Promise<boolean>;
};

export type QuizSectionListeningOrchestratorProps = {
  sectionId: number;

  renderBlocks: QuizRenderableBlock[];

  listeningRemaining: Record<string, number>;

  sectionQuotaMax?: number | null;

  playbackMode: SectionPlaybackMode;

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

 *

 * - **auto:** countdown vào section + chain lượt (inter-round 10s).

 * - **on_demand:** mỗi lượt bắt đầu bằng user gesture (nút Nghe), không autoplay giữa lượt.

 */

export const QuizSectionListeningOrchestrator = forwardRef<
  QuizSectionListeningOrchestratorHandle,
  QuizSectionListeningOrchestratorProps
>(function QuizSectionListeningOrchestrator(
  {
    sectionId,

    renderBlocks,

    listeningRemaining,

    sectionQuotaMax,

    playbackMode,

    reportListeningCycle,

    onHighlightKeyChange,

    onLocksChange,

    onPlaybackBusyChange,

    onAutoStartCountdownChange,

    onInterRoundCountdownChange,

    onPlaybackGateChange,
  },

  ref,
) {
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

  const [onDemandRoundActive, setOnDemandRoundActive] = useState(false);

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

  const flatRef = useRef(flat);

  flatRef.current = flat;

  const segIndexRef = useRef(segIndex);

  segIndexRef.current = segIndex;

  const hasQueue = flat.length > 0;

  const hasServerQuota = isKnownListeningRemaining(sectionRem);

  const isAutoMode = playbackMode === "auto";

  const isOnDemandMode = playbackMode === "on_demand";

  const autoCountdownEnabled =
    isAutoMode && playbackConfirmed && hasQueue && hasServerQuota;

  const { inCountdown: inAutoStartCountdown } =
    useSectionListeningAutoStartCountdown({
      sectionKey,

      enabled: autoCountdownEnabled,

      hasQueue,

      hasServerQuota,

      sectionRem: hasServerQuota ? sectionRem : 0,

      onCountdownChange: onAutoStartCountdownChange,
    });

  const { inCountdown: inInterRoundCountdown } = useSecondsCountdown({
    enabled: isAutoMode && interRoundPending,

    generation: interRoundGeneration,

    totalSeconds: SECTION_LISTENING_INTER_ROUND_COUNTDOWN_SECONDS,

    onTick: (s) => interRoundChangeRef.current?.(s),
  });

  const inCountdown = inAutoStartCountdown || inInterRoundCountdown;

  const playbackGateOpen =
    isAutoMode &&
    hasQueue &&
    hasServerQuota &&
    sectionRem > 0 &&
    (!playbackConfirmed || autoplayBlocked);

  const playbackStarted = isOnDemandMode
    ? onDemandRoundActive
    : isAutoMode && playbackConfirmed && !inAutoStartCountdown;

  const active =
    hasQueue &&
    hasServerQuota &&
    sectionRem > 0 &&
    playbackStarted &&
    !interRoundPending &&
    !inInterRoundCountdown &&
    !playbackGateOpen;

  const resetRound = useCallback(() => {
    roundClosedRef.current = false;

    setSegIndex(0);

    setAutoplayBlocked(false);

    needsUserGestureRef.current = false;

    setRoundGeneration((g) => g + 1);
  }, []);

  const resetRoundRef = useRef(resetRound);

  resetRoundRef.current = resetRound;

  const startSegmentPlayback = useCallback(() => {
    const el = audioRef.current;

    if (!el) return Promise.resolve(false);

    const seg = flatRef.current[segIndexRef.current];

    if (!seg?.url) return Promise.resolve(false);

    el.src = seg.url;

    const p = el.play();

    if (!p || typeof p.then !== "function") {
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
  }, []);

  const startSegmentPlaybackRef = useRef(startSegmentPlayback);

  startSegmentPlaybackRef.current = startSegmentPlayback;

  const completePlaylistRoundRef = useRef<() => void>(() => {});

  const advanceOrCompleteSegment = useCallback(() => {
    const idx = segIndexRef.current;

    const segments = flatRef.current;

    if (idx < segments.length - 1) {
      setSegIndex((i) => i + 1);

      return;
    }

    completePlaylistRoundRef.current();
  }, []);

  const advanceOrCompleteSegmentRef = useRef(advanceOrCompleteSegment);

  advanceOrCompleteSegmentRef.current = advanceOrCompleteSegment;

  const tryPlayCurrentSegment = useCallback(async (): Promise<boolean> => {
    const seg = flatRef.current[segIndexRef.current];

    if (!seg?.url) {
      advanceOrCompleteSegmentRef.current();

      return false;
    }

    return startSegmentPlaybackRef.current();
  }, []);

  const confirmSectionPlayback = useCallback(() => {
    void unlockQuizAudioSession();

    setPlaybackConfirmed(true);

    needsUserGestureRef.current = false;

    setAutoplayBlocked((blocked) => {
      if (blocked) {
        void tryPlayCurrentSegment();
      }

      return false;
    });
  }, [tryPlayCurrentSegment]);

  const confirmSectionPlaybackRef = useRef(confirmSectionPlayback);

  confirmSectionPlaybackRef.current = confirmSectionPlayback;

  useImperativeHandle(
    ref,

    () => ({
      startFromUserGesture: async () => {
        if (
          !isOnDemandMode ||
          !hasQueue ||
          !hasServerQuota ||
          sectionRem <= 0 ||
          onDemandRoundActive
        ) {
          return false;
        }

        void unlockQuizAudioSession();

        setPlaybackConfirmed(true);

        needsUserGestureRef.current = false;

        setAutoplayBlocked(false);

        resetRoundRef.current();

        const seg = flatRef.current[0];

        if (!seg) {
          setPlaybackBusy(false);

          return false;
        }

        setOnDemandRoundActive(true);

        highlightRef.current(seg.highlightKey);

        const ok = await tryPlayCurrentSegment();

        if (ok) {
          setPlaybackBusy(true);

          return true;
        }

        setOnDemandRoundActive(false);

        setPlaybackBusy(false);

        return false;
      },
    }),

    [
      hasQueue,

      hasServerQuota,

      isOnDemandMode,

      onDemandRoundActive,

      sectionRem,

      tryPlayCurrentSegment,
    ],
  );

  useEffect(() => {
    if (!playbackGateOpen) {
      gateChangeRef.current?.(null);

      return;
    }

    gateChangeRef.current?.({
      open: true,

      reason: !playbackConfirmed ? "section-start" : "autoplay-blocked",

      confirmPlayback: () => confirmSectionPlaybackRef.current(),
    });
  }, [playbackGateOpen, playbackConfirmed]);

  useEffect(() => {
    setLocalCyclesCompleted(0);

    setRoundGeneration(0);

    setSegIndex(0);

    setInterRoundPending(false);

    setInterRoundGeneration(0);

    setOnDemandRoundActive(false);

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
      }),
    );
  }, [
    hasQueue,
    hasServerQuota,
    sectionRem,
    sectionQuotaMax,
    localCyclesCompleted,
  ]);

  useEffect(() => {
    onPlaybackBusyChange?.(playbackBusy || inCountdown || playbackGateOpen);
  }, [onPlaybackBusyChange, playbackBusy, inCountdown, playbackGateOpen]);

  const prevRemRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!hasQueue) return;

    if (prevRemRef.current !== sectionRem) {
      prevRemRef.current = sectionRem;

      if (!interRoundPending) {
        resetRound();
      }
    }
  }, [hasQueue, sectionRem, resetRound, interRoundPending]);

  useEffect(() => {
    if (!isAutoMode || !interRoundPending) return;

    if (inInterRoundCountdown) return;

    resetRound();

    setInterRoundPending(false);

    interRoundChangeRef.current?.(null);
  }, [inInterRoundCountdown, interRoundPending, isAutoMode, resetRound]);

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

          setOnDemandRoundActive(false);

          setPlaybackBusy(false);

          return;
        }

        if (isOnDemandMode) {
          resetRound();

          setOnDemandRoundActive(false);

          setPlaybackBusy(false);

          return;
        }

        if (isAutoMode && remBefore - 1 > 0) {
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

        setOnDemandRoundActive(false);

        setPlaybackBusy(false);
      }
    })();
  }, [isAutoMode, isOnDemandMode, resetRound, sectionKey, sectionRem]);

  completePlaylistRoundRef.current = completePlaylistRound;

  useEffect(() => {
    if (!active) {
      if (!inInterRoundCountdown && !playbackGateOpen) {
        highlightRef.current(null);
      }

      if (!inInterRoundCountdown && !playbackGateOpen && !onDemandRoundActive) {
        setPlaybackBusy(false);
      }

      return;
    }

    const seg = flat[segIndex];

    if (!seg) {
      highlightRef.current(null);

      setPlaybackBusy(false);

      return;
    }

    highlightRef.current(seg.highlightKey);

    if (needsUserGestureRef.current) {
      setPlaybackBusy(false);

      return;
    }

    const el = audioRef.current;

    if (el && !el.paused && el.src && !el.ended) {
      setPlaybackBusy(true);

      return;
    }

    setPlaybackBusy(true);

    void tryPlayCurrentSegment().then((ok) => {
      if (ok) return;

      if (needsUserGestureRef.current) {
        setPlaybackBusy(false);

        return;
      }

      setPlaybackBusy(false);
    });

    return () => {
      audioRef.current?.pause();
    };
  }, [
    active,

    flat,

    segIndex,

    roundGeneration,

    tryPlayCurrentSegment,

    inInterRoundCountdown,

    playbackGateOpen,

    onDemandRoundActive,
  ]);

  useEffect(() => {
    const el = audioRef.current;

    if (!el || !active) return;

    const advanceOrComplete = () => {
      advanceOrCompleteSegmentRef.current();
    };

    const onEnded = () => advanceOrComplete();

    const onError = () => advanceOrComplete();

    el.addEventListener("ended", onEnded);

    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("ended", onEnded);

      el.removeEventListener("error", onError);
    };
  }, [active, flat.length, segIndex]);

  if (!hasQueue || !hasServerQuota) {
    return null;
  }

  return (
    <audio
      ref={audioRef}
      preload="auto"
      className="sr-only h-0 w-0"
      aria-hidden
      playsInline
    />
  );
});

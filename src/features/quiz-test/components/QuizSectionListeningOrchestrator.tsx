'use client';

import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  computeSectionListeningLocks,
  getSectionListeningStatusSuffix,
  hasHeardSectionListeningAtLeastOnce,
  type SectionListeningLocks,
} from '@/features/quiz-test/lib/quiz-section-listening-locks';
import { quizSectionListeningStorageKey } from '@/features/quiz-test/lib/quiz-listening-rules';
import { flattenSectionListeningQueue } from '@/features/quiz-test/lib/quiz-section-listening-queue';
import { Alert } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type QuizSectionListeningOrchestratorProps = {
  sectionId: number;
  renderBlocks: QuizRenderableBlock[];
  listeningRemaining: Record<string, number>;
  /** Lượt nghe tối đa của section (từ đề) — dùng tính đã nghe khi resume. */
  sectionQuotaMax?: number | null;
  reportListeningCycle: (formItemKey: string) => Promise<void>;
  onHighlightKeyChange: (key: string | null) => void;
  onLocksChange: (locks: SectionListeningLocks) => void;
};

/**
 * Một player cho toàn section: phát lần lượt mọi track của mọi câu/bundle có autoplay,
 * báo một listening-cycle cho key `section:<id>` sau mỗi vòng hết toàn chuỗi.
 */
export function QuizSectionListeningOrchestrator({
  sectionId,
  renderBlocks,
  listeningRemaining,
  sectionQuotaMax,
  reportListeningCycle,
  onHighlightKeyChange,
  onLocksChange,
}: QuizSectionListeningOrchestratorProps) {
  const flat = useMemo(
    () => flattenSectionListeningQueue(renderBlocks),
    [renderBlocks],
  );
  const sectionKey = quizSectionListeningStorageKey(sectionId);
  const sectionRem = listeningRemaining[sectionKey];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [segIndex, setSegIndex] = useState(0);
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
  const hasServerQuota =
    typeof sectionRem === 'number' && Number.isFinite(sectionRem);
  const active = hasQueue && hasServerQuota && sectionRem > 0;

  const heardAtLeastOnce = hasHeardSectionListeningAtLeastOnce({
    hasQueue,
    hasServerQuota,
    sectionQuotaMax,
    sectionRem: hasServerQuota ? sectionRem : 0,
    localCyclesCompleted,
  });

  useEffect(() => {
    setLocalCyclesCompleted(0);
  }, [sectionKey]);

  useEffect(() => {
    return () => {
      locksRef.current({ navLocked: false, submitLocked: false });
      highlightRef.current(null);
    };
  }, []);

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
        playbackBusy,
      }),
    );
  }, [
    hasQueue,
    hasServerQuota,
    sectionRem,
    sectionQuotaMax,
    localCyclesCompleted,
    playbackBusy,
  ]);

  const resetRound = useCallback(() => {
    roundClosedRef.current = false;
    setSegIndex(0);
    setAutoplayBlocked(false);
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
        await reportRef.current(sectionKey);
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
  }, [active, flat, segIndex]);

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

  const statusSuffix = getSectionListeningStatusSuffix(
    sectionRem,
    heardAtLeastOnce,
  );

  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="text-sm text-neutral-700">
        Phần nghe: audio sẽ phát lần lượt theo thứ tự câu. Còn{' '}
        <strong>{Math.max(0, sectionRem)}</strong> lượt phát cả chuỗi.
        {statusSuffix}
      </div>
      <audio ref={audioRef} preload="auto" className="sr-only h-0 w-0" aria-hidden />
      {autoplayBlocked ? (
        <Alert
          className="mt-2"
          type="warning"
          showIcon
          message="Âm thanh chưa phát được"
          description="Trình duyệt có thể chặn tự phát. Thử tương tác nhẹ với trang hoặc kiểm tra quyền âm thanh."
        />
      ) : null}
    </div>
  );
}

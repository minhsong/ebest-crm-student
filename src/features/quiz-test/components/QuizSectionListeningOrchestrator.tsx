'use client';

import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import { buildSectionListeningQueue } from '@/features/quiz-test/lib/quiz-section-listening-queue';
import { quizSectionListeningStorageKey } from '@/features/quiz-test/lib/quiz-section-listening-key';
import { Alert } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type FlatSeg = { url: string; highlightKey: string };

function flattenQueue(blocks: QuizRenderableBlock[]): FlatSeg[] {
  const q = buildSectionListeningQueue(blocks);
  const out: FlatSeg[] = [];
  for (const item of q) {
    for (const t of item.tracks) {
      const url = typeof t.url === 'string' && t.url.trim() ? t.url.trim() : '';
      if (!url) continue;
      out.push({ url, highlightKey: item.highlightKey });
    }
  }
  return out;
}

export type QuizSectionListeningOrchestratorProps = {
  sectionId: number;
  renderBlocks: QuizRenderableBlock[];
  listeningRemaining: Record<string, number>;
  reportListeningCycle: (formItemKey: string) => Promise<void>;
  onHighlightKeyChange: (key: string | null) => void;
  /** `true` khi chưa hết lượt section (theo server) hoặc đang phát chuỗi audio. */
  onNavLockChange: (locked: boolean) => void;
};

/**
 * Một player cho toàn section: phát lần lượt mọi track của mọi câu/bundle có autoplay,
 * báo một listening-cycle cho key `section:<id>` sau mỗi vòng hết toàn chuỗi.
 */
export function QuizSectionListeningOrchestrator({
  sectionId,
  renderBlocks,
  listeningRemaining,
  reportListeningCycle,
  onHighlightKeyChange,
  onNavLockChange,
}: QuizSectionListeningOrchestratorProps) {
  const flat = useMemo(() => flattenQueue(renderBlocks), [renderBlocks]);
  const sectionKey = quizSectionListeningStorageKey(sectionId);
  const sectionRem = listeningRemaining[sectionKey];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [segIndex, setSegIndex] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playbackBusy, setPlaybackBusy] = useState(false);
  const roundClosedRef = useRef(false);
  const reportRef = useRef(reportListeningCycle);
  reportRef.current = reportListeningCycle;
  const highlightRef = useRef(onHighlightKeyChange);
  highlightRef.current = onHighlightKeyChange;
  const navRef = useRef(onNavLockChange);
  navRef.current = onNavLockChange;

  useEffect(() => {
    return () => {
      navRef.current(false);
      highlightRef.current(null);
    };
  }, []);

  const hasServerQuota = typeof sectionRem === 'number' && Number.isFinite(sectionRem);
  const active = flat.length > 0 && hasServerQuota && sectionRem > 0;

  useEffect(() => {
    if (!flat.length || !hasServerQuota) {
      navRef.current(false);
      highlightRef.current(null);
      return;
    }
    const locked = sectionRem > 0 || playbackBusy;
    navRef.current(locked);
  }, [flat.length, hasServerQuota, sectionRem, playbackBusy]);

  const resetRound = useCallback(() => {
    roundClosedRef.current = false;
    setSegIndex(0);
    setAutoplayBlocked(false);
  }, []);

  const prevRemRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!flat.length) return;
    if (prevRemRef.current !== sectionRem) {
      prevRemRef.current = sectionRem;
      resetRound();
    }
  }, [flat.length, sectionRem, resetRound]);

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
    const onEnded = () => {
      if (segIndex < flat.length - 1) {
        setSegIndex((i) => i + 1);
        return;
      }
      if (!roundClosedRef.current) {
        roundClosedRef.current = true;
        highlightRef.current(null);
        void (async () => {
          try {
            await reportRef.current(sectionKey);
          } finally {
            setPlaybackBusy(false);
          }
        })();
      }
    };
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, [active, flat.length, segIndex, sectionKey]);

  if (!flat.length) return null;

  if (!hasServerQuota) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="text-sm text-neutral-700">
        Phần nghe: audio sẽ phát lần lượt theo thứ tự câu. Còn{' '}
        <strong>{Math.max(0, sectionRem)}</strong> lượt phát cả chuỗi.
        {sectionRem > 0
          ? ' Hoàn thành hết lượt mới chuyển phần khác.'
          : null}
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

'use client';

import {
  getQuizDashboardScrollElement,
} from '@/features/quiz-test/lib/quiz-dashboard-scroll';
import { QUIZ_ATTEMPT_STICKY_VIEWPORT_TOP } from '@/lib/ui-constants';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type QuizAttemptStickyPinState = {
  isPinned: boolean;
  barHeight: number;
  /** Cạnh trái vùng content (viewport) — căn pin theo cột bài làm. */
  pinLeft: number;
  pinWidth: number;
};

/** Pin cụm timer/lượt nghe góc phải trên khi scroll dashboard content. */
export function useQuizAttemptStickyPin(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<QuizAttemptStickyPinState>({
    isPinned: false,
    barHeight: 0,
    pinLeft: 0,
    pinWidth: 320,
  });

  const measure = useCallback(() => {
    if (!enabled) {
      setState((prev) =>
        prev.isPinned
          ? { isPinned: false, barHeight: 0, pinLeft: 0, pinWidth: 320 }
          : prev,
      );
      return;
    }

    const scrollEl = getQuizDashboardScrollElement();
    const sentinel = sentinelRef.current;
    const bar = barRef.current;
    const container = containerRef.current;
    if (!scrollEl || !sentinel || !bar || !container) return;

    const barHeight = bar.offsetHeight;
    const containerRect = container.getBoundingClientRect();
    const pinLeft = Math.max(0, containerRect.left);
    const pinWidth = Math.max(200, containerRect.width);

    const shouldPin =
      sentinel.getBoundingClientRect().top < QUIZ_ATTEMPT_STICKY_VIEWPORT_TOP;

    if (!shouldPin) {
      setState({ isPinned: false, barHeight, pinLeft, pinWidth });
      return;
    }

    setState({ isPinned: true, barHeight, pinLeft, pinWidth });
  }, [enabled]);

  useLayoutEffect(() => {
    if (!enabled) return;
    measure();
  }, [enabled, measure]);

  useEffect(() => {
    if (!enabled) return;

    let scrollEl: Element | null = null;
    let detachScroll: () => void = () => undefined;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    const bind = () => {
      scrollEl = getQuizDashboardScrollElement();
      const sentinel = sentinelRef.current;
      if (!scrollEl || !sentinel) return false;

      detachScroll();
      scrollEl.addEventListener('scroll', measure, { passive: true });
      detachScroll = () => scrollEl?.removeEventListener('scroll', measure);

      io?.disconnect();
      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(() => measure(), {
          root: scrollEl,
          rootMargin: `-${QUIZ_ATTEMPT_STICKY_VIEWPORT_TOP}px 0px 0px 0px`,
          threshold: [0, 1],
        });
        io.observe(sentinel);
      }

      measure();
      return true;
    };

    const container = containerRef.current;
    const bar = barRef.current;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      if (container) ro.observe(container);
      if (bar) ro.observe(bar);
    }

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });

    if (!bind()) {
      const retryId = window.setInterval(() => {
        if (bind()) window.clearInterval(retryId);
      }, 150);
      return () => {
        window.clearInterval(retryId);
        detachScroll();
        window.removeEventListener('resize', measure);
        window.removeEventListener('scroll', measure);
        ro?.disconnect();
        io?.disconnect();
      };
    }

    return () => {
      detachScroll();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
      ro?.disconnect();
      io?.disconnect();
    };
  }, [enabled, measure]);

  return {
    containerRef,
    sentinelRef,
    barRef,
    ...state,
    stickyTop: QUIZ_ATTEMPT_STICKY_VIEWPORT_TOP,
  };
}

'use client';

import { SECTION_LISTENING_AUTO_START_COUNTDOWN_SECONDS } from '@/features/quiz-test/lib/quiz-listening-rules';
import { useEffect, useRef, useState } from 'react';

type Args = {
  sectionKey: string;
  enabled: boolean;
  hasQueue: boolean;
  hasServerQuota: boolean;
  sectionRem: number;
  onCountdownChange?: (seconds: number | null) => void;
};

/**
 * Auto mode: đếm ngược trước khi phát — một lần / section (kể cả quota load trễ).
 */
export function useSectionListeningAutoStartCountdown({
  sectionKey,
  enabled,
  hasQueue,
  hasServerQuota,
  sectionRem,
  onCountdownChange,
}: Args) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const sessionRef = useRef<string | null>(null);
  const onChangeRef = useRef(onCountdownChange);
  onChangeRef.current = onCountdownChange;

  useEffect(() => {
    sessionRef.current = null;
    setSecondsLeft(null);
    onChangeRef.current?.(null);
  }, [sectionKey]);

  useEffect(() => {
    if (!enabled || !hasQueue || !hasServerQuota || sectionRem <= 0) {
      return;
    }
    if (sessionRef.current === sectionKey) {
      return;
    }
    sessionRef.current = sectionKey;

    let remaining = SECTION_LISTENING_AUTO_START_COUNTDOWN_SECONDS;
    setSecondsLeft(remaining);
    onChangeRef.current?.(remaining);

    const id = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(id);
        setSecondsLeft(null);
        onChangeRef.current?.(null);
      } else {
        setSecondsLeft(remaining);
        onChangeRef.current?.(remaining);
      }
    }, 1000);

    return () => {
      window.clearInterval(id);
      setSecondsLeft(null);
      onChangeRef.current?.(null);
    };
  }, [enabled, hasQueue, hasServerQuota, sectionKey, sectionRem]);

  const inCountdown = secondsLeft != null && secondsLeft > 0;
  return { secondsLeft, inCountdown };
}

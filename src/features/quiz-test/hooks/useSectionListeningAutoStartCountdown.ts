'use client';

import {
  SECTION_LISTENING_AUTO_START_COUNTDOWN_SECONDS,
} from '@/features/quiz-test/lib/quiz-listening-rules';
import { useSecondsCountdown } from '@/features/quiz-test/hooks/useSecondsCountdown';
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
  const [generation, setGeneration] = useState(0);
  const sessionRef = useRef<string | null>(null);
  const onChangeRef = useRef(onCountdownChange);
  onChangeRef.current = onCountdownChange;

  useEffect(() => {
    sessionRef.current = null;
    setGeneration(0);
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
    setGeneration((g) => g + 1);
  }, [enabled, hasQueue, hasServerQuota, sectionKey, sectionRem]);

  const shouldRun = enabled && hasQueue && hasServerQuota && sectionRem > 0;

  const { secondsLeft, inCountdown } = useSecondsCountdown({
    enabled: shouldRun && generation > 0,
    generation,
    totalSeconds: SECTION_LISTENING_AUTO_START_COUNTDOWN_SECONDS,
    onTick: (s) => onChangeRef.current?.(s),
  });

  return { secondsLeft, inCountdown };
}

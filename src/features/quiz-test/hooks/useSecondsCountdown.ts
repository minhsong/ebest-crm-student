'use client';

import { useEffect, useRef, useState } from 'react';

type Args = {
  enabled: boolean;
  /** Đổi giá trị để chạy lại countdown từ đầu. */
  generation: number;
  totalSeconds: number;
  onTick?: (secondsLeft: number | null) => void;
};

/** Đếm ngược theo giây — dùng cho auto-start / nghỉ giữa các lượt nghe. */
export function useSecondsCountdown({
  enabled,
  generation,
  totalSeconds,
  onTick,
}: Args) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!enabled || totalSeconds <= 0) {
      setSecondsLeft(null);
      onTickRef.current?.(null);
      return;
    }

    let remaining = totalSeconds;
    setSecondsLeft(remaining);
    onTickRef.current?.(remaining);

    const id = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(id);
        setSecondsLeft(null);
        onTickRef.current?.(null);
      } else {
        setSecondsLeft(remaining);
        onTickRef.current?.(remaining);
      }
    }, 1000);

    return () => {
      window.clearInterval(id);
      setSecondsLeft(null);
      onTickRef.current?.(null);
    };
  }, [enabled, generation, totalSeconds]);

  const inCountdown = secondsLeft != null && secondsLeft > 0;
  return { secondsLeft, inCountdown };
}

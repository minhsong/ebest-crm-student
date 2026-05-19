'use client';

import { Alert } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { QuizAudioTrack } from '@/features/quiz-test/lib/quiz-content-audio';

type QuizHiddenListeningPlayerProps = {
  tracks: QuizAudioTrack[];
  /** Khi false — không gọi play (hết lượt hoặc không có track). */
  canPlay: boolean;
  /** Sau khi phát xong track cuối (một vòng playlist). */
  onPlaylistRoundCompleted: () => void;
};

/**
 * Player ẩn — không controls; autoplay theo §10.2.
 * Một vòng = tuần tự hết tracks; khi track cuối `ended` → callback (server trừ remaining).
 *
 * Callback giữ qua ref để không nằm trong dependency của `play()` — inline fn từ cha
 * đổi mỗi render sẽ khiến `play()` chạy lại → nghe như phát 2 lần với repeatCount = 1.
 */
export function QuizHiddenListeningPlayer({
  tracks,
  canPlay,
  onPlaylistRoundCompleted,
}: QuizHiddenListeningPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onPlaylistRoundCompleted);
  onCompleteRef.current = onPlaylistRoundCompleted;

  const resetForNewCycle = useCallback(() => {
    completedRef.current = false;
    setIndex(0);
    setAutoplayBlocked(false);
  }, []);

  useEffect(() => {
    resetForNewCycle();
  }, [tracks, canPlay, resetForNewCycle]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!canPlay || !tracks.length) {
      el.pause();
      el.removeAttribute('src');
      return;
    }
    const track = tracks[index];
    if (!track?.url) {
      if (index < tracks.length - 1) setIndex((i) => i + 1);
      else if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }
    el.src = track.url;
    const p = el.play();
    if (p && typeof p.then === 'function') {
      void p.then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
    }
    return () => {
      el.pause();
    };
  }, [canPlay, index, tracks]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      if (index < tracks.length - 1) {
        setIndex((i) => i + 1);
        return;
      }
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    };
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, [index, tracks.length]);

  if (!tracks.length) return null;

  return (
    <>
      <audio ref={audioRef} preload="auto" className="sr-only h-0 w-0" aria-hidden />
      {autoplayBlocked ? (
        <Alert
          className="mt-2"
          type="warning"
          showIcon
          message="Âm thanh chưa phát được"
          description="Trình duyệt có thể đang chặn tự phát. Hãy kiểm tra quyền âm thanh, chế độ im lặng, hoặc tương tác nhẹ với trang rồi tải lại nếu cần."
        />
      ) : null}
    </>
  );
}

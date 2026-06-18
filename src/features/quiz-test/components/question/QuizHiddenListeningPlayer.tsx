'use client';

import { SoundOutlined } from '@ant-design/icons';
import { Button } from 'antd';
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
 */
export function QuizHiddenListeningPlayer({
  tracks,
  canPlay,
  onPlaylistRoundCompleted,
}: QuizHiddenListeningPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const needsUserGestureRef = useRef(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onPlaylistRoundCompleted);
  onCompleteRef.current = onPlaylistRoundCompleted;

  const resetForNewCycle = useCallback(() => {
    completedRef.current = false;
    setIndex(0);
    needsUserGestureRef.current = false;
    setNeedsUserGesture(false);
  }, []);

  const startTrackPlayback = useCallback(() => {
    const el = audioRef.current;
    if (!el) return Promise.resolve(false);
    const track = tracks[index];
    if (!track?.url) return Promise.resolve(false);
    el.src = track.url;
    const p = el.play();
    if (!p || typeof p.then !== 'function') {
      return Promise.resolve(true);
    }
    return p
      .then(() => {
        needsUserGestureRef.current = false;
        setNeedsUserGesture(false);
        return true;
      })
      .catch(() => {
        needsUserGestureRef.current = true;
        setNeedsUserGesture(true);
        return false;
      });
  }, [index, tracks]);

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
    if (needsUserGestureRef.current) {
      return;
    }
    void startTrackPlayback();
    return () => {
      el.pause();
    };
  }, [canPlay, index, tracks, startTrackPlayback]);

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
      <audio ref={audioRef} preload="auto" className="sr-only h-0 w-0" aria-hidden playsInline />
      {needsUserGesture ? (
        <div className="mt-2 rounded border border-blue-500/90 bg-blue-50 px-3 py-2.5 text-center dark:border-blue-500 dark:bg-blue-950/50">
          <p className="mb-2 text-xs text-blue-900 dark:text-blue-200">
            Nhấn nút bên dưới để phát âm thanh (Safari/iOS yêu cầu thao tác của bạn).
          </p>
          <Button
            type="primary"
            icon={<SoundOutlined />}
            onClick={() => {
              void startTrackPlayback();
            }}
          >
            Nhấn để nghe
          </Button>
        </div>
      ) : null}
    </>
  );
}

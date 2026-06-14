'use client';

import { memo, useCallback, useRef } from 'react';
import { SoundOutlined } from '@ant-design/icons';

type Props = {
  promptAudioUrl: string;
};

function AudioMcqPromptInner({ promptAudioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const replayAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play();
  }, []);

  return (
    <>
      <p className="drill-prompt-card__eyebrow">Nghe và chọn</p>
      <button
        type="button"
        className="drill-prompt-card__audio-btn"
        onClick={replayAudio}
        aria-label="Phát lại âm thanh"
      >
        <SoundOutlined />
      </button>
      <div className="drill-prompt-card__audio-wrap">
        <audio ref={audioRef} autoPlay src={promptAudioUrl} />
      </div>
    </>
  );
}

export const AudioMcqPrompt = memo(AudioMcqPromptInner);

import type { CSSProperties } from 'react';
import type { MediaTimelineReviewKind } from '../types';
import { PORTAL_VIDEO_MAX_HEIGHT } from '../media-review-layout';

type MediaPlayerProps = {
  mediaUrl: string;
  mediaKind: MediaTimelineReviewKind;
  mediaTitle?: string;
  bindMediaRef: (el: HTMLMediaElement | null) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
};

const AUDIO_WRAPPER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  flexShrink: 0,
};

export function MediaPlayer({
  mediaUrl,
  mediaKind,
  mediaTitle,
  bindMediaRef,
  onTimeUpdate,
  onLoadedMetadata,
}: MediaPlayerProps) {
  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      {mediaTitle ? (
        <strong style={{ display: 'block', marginBottom: 8 }}>{mediaTitle}</strong>
      ) : null}
      {mediaKind === 'video' ? (
        <video
          ref={bindMediaRef}
          src={mediaUrl}
          controls
          preload="metadata"
          style={{
            width: '100%',
            maxHeight: PORTAL_VIDEO_MAX_HEIGHT,
            borderRadius: 8,
            display: 'block',
          }}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
        />
      ) : (
        <div style={AUDIO_WRAPPER_STYLE}>
          <audio
            ref={bindMediaRef}
            src={mediaUrl}
            controls
            preload="metadata"
            style={{ width: '100%' }}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
          />
        </div>
      )}
    </div>
  );
}

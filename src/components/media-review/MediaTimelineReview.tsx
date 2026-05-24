'use client';

import { useCallback, useMemo, useRef, type CSSProperties } from 'react';
import { Typography } from 'antd';
import type { MediaTimelineReviewProps } from './types';
import { sortComments } from './media-review-utils';
import { commentHasFeedback } from './pronunciation-utils';
import { useMediaPlayback } from './useMediaPlayback';
import { useActiveCommentSync } from './hooks/useActiveCommentSync';
import { MediaPlayer } from './components/MediaPlayer';
import { MediaCommentRow } from './components/MediaCommentRow';
import { MediaCommentActiveDetail } from './components/MediaCommentActiveDetail';
import { PORTAL_COMMENT_LIST_MIN_HEIGHT } from './media-review-layout';

const { Text } = Typography;

const LIST_PANEL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fafafa',
  minHeight: 0,
};

const LIST_MAX_HEIGHT = 280;

export function MediaTimelineReview({
  mediaUrl,
  mediaKind,
  mediaTitle,
  comments: commentsProp,
  durationMs: durationMsProp,
  onActiveCommentChange,
  onSeek,
  className,
  timelineHeight = 360,
  pronunciationCatalog = null,
}: MediaTimelineReviewProps) {
  const sorted = useMemo(
    () => sortComments(commentsProp).filter((c) => commentHasFeedback(c)),
    [commentsProp],
  );
  const listRef = useRef<HTMLDivElement>(null);
  const listMaxHeight = Math.max(LIST_MAX_HEIGHT, timelineHeight - 244);

  const {
    bindMediaRef,
    currentTimeMs,
    durationMs: detectedDurationMs,
    seek,
    play,
    onTimeUpdate,
    onLoadedMetadata,
  } = useMediaPlayback(mediaUrl, mediaKind);

  const durationMs = durationMsProp ?? detectedDurationMs;

  const activeComment = useActiveCommentSync(
    sorted,
    currentTimeMs,
    listRef,
    onActiveCommentChange,
  );

  const handleSeekComment = useCallback(
    (c: { startMs: number }) => {
      seek(c.startMs);
      onSeek?.(c.startMs);
      play();
    },
    [onSeek, play, seek],
  );

  return (
    <div className={className} style={{ width: '100%' }}>
      <MediaPlayer
        mediaUrl={mediaUrl}
        mediaKind={mediaKind}
        mediaTitle={mediaTitle}
        bindMediaRef={bindMediaRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
      />

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <MediaCommentActiveDetail
          comment={activeComment}
          catalog={pronunciationCatalog}
        />

        <div style={{ ...LIST_PANEL_STYLE, maxHeight: listMaxHeight }}>
          <div
            style={{
              flexShrink: 0,
              padding: '8px 10px',
              borderBottom: '1px solid #f0f0f0',
              background: '#fff',
            }}
          >
            <Text strong style={{ fontSize: 13 }}>
              Danh sách ({sorted.length})
            </Text>
          </div>
          <div
            ref={listRef}
            style={{
              minHeight: PORTAL_COMMENT_LIST_MIN_HEIGHT,
              maxHeight: listMaxHeight - 40,
              overflowY: 'auto',
              padding: '4px 6px',
            }}
          >
            {sorted.map((c) => (
              <MediaCommentRow
                key={c.id}
                comment={c}
                isActive={activeComment?.id === c.id}
                onSeek={() => handleSeekComment(c)}
              />
            ))}
            {sorted.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 13, padding: 8, display: 'block' }}>
                Chưa có nhận xét theo thời gian.
              </Text>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

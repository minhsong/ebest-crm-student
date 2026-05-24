'use client';

import type { CSSProperties } from 'react';
import { Typography } from 'antd';
import type { MediaReviewComment } from '../types';
import { formatMs } from '../media-review-utils';
import { commentSummaryMetaText } from '../pronunciation-utils';
import {
  MEDIA_COMMENT_CONTENT_ACTIVE,
  MEDIA_COMMENT_ROW_ACTIVE,
  MEDIA_COMMENT_ROW_BASE,
  MEDIA_COMMENT_TIME_ACTIVE,
} from '../media-review-styles';

const { Text } = Typography;

const LIST_FONT_SIZE = 13;

const ELLIPSIS_LINE: CSSProperties = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: LIST_FONT_SIZE,
  lineHeight: 1.45,
};

type Props = {
  comment: MediaReviewComment;
  isActive: boolean;
  onSeek: () => void;
};

/** Dòng danh sách — chỉ tóm tắt, không mở chi tiết khi active. */
export function MediaCommentRow({ comment, isActive, onSeek }: Props) {
  const notePreview = (comment.note ?? '').trim();
  const meta = commentSummaryMetaText(comment);

  return (
    <div
      data-comment-id={comment.id}
      style={{
        ...MEDIA_COMMENT_ROW_BASE,
        ...(isActive ? MEDIA_COMMENT_ROW_ACTIVE : {}),
        flexDirection: 'column',
        alignItems: 'stretch',
        cursor: 'pointer',
        scrollMarginTop: 8,
        padding: '8px 10px',
      }}
      onClick={onSeek}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
        <Text
          code
          style={{
            flexShrink: 0,
            minWidth: 52,
            fontSize: LIST_FONT_SIZE,
            ...(isActive ? MEDIA_COMMENT_TIME_ACTIVE : {}),
          }}
        >
          {formatMs(comment.startMs)}
        </Text>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              ...ELLIPSIS_LINE,
              color: isActive ? '#141414' : 'rgba(0,0,0,0.65)',
              fontWeight: isActive ? 600 : 400,
              ...(isActive ? MEDIA_COMMENT_CONTENT_ACTIVE : {}),
            }}
            title={meta}
          >
            {meta}
          </span>
          {notePreview ? (
            <span
              style={{
                ...ELLIPSIS_LINE,
                marginTop: 2,
                color: 'rgba(0,0,0,0.45)',
              }}
              title={notePreview}
            >
              {notePreview}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

'use client';

import type { CSSProperties } from 'react';
import { Typography } from 'antd';
import type { MediaReviewComment, PronunciationReviewCatalog } from '../types';
import { PronunciationFeedbackView } from './PronunciationFeedbackView';

const { Text } = Typography;

const DETAIL_PANEL_STYLE: CSSProperties = {
  padding: 14,
  borderRadius: 8,
  border: '1px solid #e8e8e8',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 280,
  overflow: 'hidden',
};

type Props = {
  comment: MediaReviewComment | null;
  catalog: PronunciationReviewCatalog | null;
};

/** Khung chi tiết nhận xét đoạn đang active. */
export function MediaCommentActiveDetail({ comment, catalog }: Props) {
  return (
    <div style={DETAIL_PANEL_STYLE}>
      {comment ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <PronunciationFeedbackView comment={comment} catalog={catalog} />
        </div>
      ) : (
        <Text type="secondary" style={{ fontSize: 13 }}>
          Phát bài hoặc chọn mốc trong danh sách để xem chi tiết nhận xét.
        </Text>
      )}
    </div>
  );
}

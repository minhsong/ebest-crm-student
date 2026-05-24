'use client';

import { Typography } from 'antd';
import type { MediaReviewComment, PronunciationReviewCatalog } from '../types';
import { FEEDBACK_COLUMNS_ROW_STYLE } from '../media-review-styles';
import { buildFeedbackColumnNodes } from './pronunciation-feedback/buildFeedbackColumnNodes';
import { TimelineNoteSection } from './pronunciation-feedback/TimelineNoteSection';

const { Text } = Typography;

type Props = {
  comment: MediaReviewComment;
  catalog: PronunciationReviewCatalog | null;
};

/** Chi tiết nhận xét đoạn: timeline-note (trên) + cột card (dưới). */
export function PronunciationFeedbackView({ comment, catalog }: Props) {
  const noteText = (comment.note ?? '').trim();
  const columns = buildFeedbackColumnNodes(comment, catalog);

  if (columns.length === 0 && !noteText) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <TimelineNoteSection
        startMs={comment.startMs}
        noteText={noteText}
        showDivider={columns.length > 0}
      />
      {columns.length > 0 ? (
        <div style={FEEDBACK_COLUMNS_ROW_STYLE}>{columns}</div>
      ) : null}
    </div>
  );
}

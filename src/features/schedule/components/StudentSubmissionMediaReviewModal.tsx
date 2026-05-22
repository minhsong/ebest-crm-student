'use client';

import { Modal } from 'antd';
import {
  MediaTimelineReview,
  inferMediaKind,
  type MediaReviewComment,
} from '@/components/media-review';

type Props = {
  open: boolean;
  title: string;
  url: string;
  mimeType?: string | null;
  resourceKind?: string | null;
  comments: MediaReviewComment[];
  durationMs?: number;
  onClose: () => void;
};

export function StudentSubmissionMediaReviewModal({
  open,
  title,
  url,
  mimeType,
  resourceKind,
  comments,
  durationMs,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={null}
      width={840}
      maskClosable={false}
      destroyOnClose
    >
      <MediaTimelineReview
        mode="view"
        mediaUrl={url}
        mediaKind={inferMediaKind(mimeType, resourceKind)}
        comments={comments}
        durationMs={durationMs}
        timelineHeight={360}
      />
    </Modal>
  );
}

'use client';

import { Button, Card, Flex, Space, Tag, Typography, theme } from 'antd';
import {
  CommentOutlined,
  ExportOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { inferMediaKind, isMediaPlayable } from '@/components/media-review';
import type { StudentSubmissionAttachment } from '@/types/student-assignment-detail';

const { Text } = Typography;

type Props = {
  attachments: StudentSubmissionAttachment[];
  submissionLocked: boolean;
  onOpenTimeline: (att: StudentSubmissionAttachment, label: string) => void;
  onOpenPlainPlay: (att: StudentSubmissionAttachment, label: string) => void;
};

export function StudentSubmissionReviewList({
  attachments,
  submissionLocked,
  onOpenTimeline,
  onOpenPlainPlay,
}: Props) {
  const { token } = theme.useToken();
  const playable = attachments.filter((a) =>
    isMediaPlayable(a.mimeType, a.resourceKind),
  );

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {playable.map((a, index) => {
        const label = `Bài ${index + 1}`;
        const hasComments = (a.mediaReviewComments?.length ?? 0) > 0;
        const isVideo = inferMediaKind(a.mimeType, a.resourceKind) === 'video';
        const Icon = isVideo ? VideoCameraOutlined : SoundOutlined;

        return (
          <Card
            key={a.id}
            size="small"
            styles={{ body: { padding: token.paddingSM } }}
          >
            <Flex justify="space-between" align="center" gap="middle" wrap>
              <Space size="small">
                <Icon style={{ fontSize: 18, color: token.colorPrimary }} />
                <Text strong>{label}</Text>
                {hasComments ? (
                  <Tag color="success" icon={<CommentOutlined />}>
                    Đã nhận xét
                  </Tag>
                ) : submissionLocked ? (
                  <Tag>Chưa có nhận xét timeline</Tag>
                ) : null}
              </Space>
              <Space size="small" wrap>
                {submissionLocked && hasComments ? (
                  <Button
                    type="primary"
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={() => onOpenTimeline(a, label)}
                  >
                    Xem nhận xét
                  </Button>
                ) : null}
                {isMediaPlayable(a.mimeType, a.resourceKind) ? (
                  <Button
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() =>
                      hasComments && submissionLocked
                        ? onOpenTimeline(a, label)
                        : onOpenPlainPlay(a, label)
                    }
                  >
                    {submissionLocked && hasComments ? 'Nghe lại' : 'Phát'}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    icon={<ExportOutlined />}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mở
                  </Button>
                )}
              </Space>
            </Flex>
          </Card>
        );
      })}
      {attachments.length > playable.length ? (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {attachments.length - playable.length} file khác (không phải âm thanh/video).
        </Text>
      ) : null}
    </Space>
  );
}

'use client';

import { Card, Flex, Typography, theme } from 'antd';
import type { StudentAssignmentAttachment } from '@/types/student-assignment-detail';

const { Text } = Typography;

type StudentWritingDictationAudioPanelProps = {
  items: StudentAssignmentAttachment[];
};

/** Phát audio đính kèm cho bài chép chính tả — điều khiển play chủ động. */
export function StudentWritingDictationAudioPanel({
  items,
}: StudentWritingDictationAudioPanelProps) {
  const { token } = theme.useToken();

  if (!items.length) {
    return (
      <Card size="small" type="inner">
        <Text type="secondary">
          Giáo viên chưa đính kèm file nghe. Bạn vẫn có thể viết theo hướng dẫn trong đề bài.
        </Text>
      </Card>
    );
  }

  return (
    <Flex vertical gap="small">
      {items.map((item, index) => {
        const url = item.url?.trim() ?? '';
        const key = item.id ?? item.fileId ?? `${url}-${index}`;
        return (
          <Card key={key} size="small" type="inner">
            <Flex vertical gap={8}>
              <Text strong>{item.name || `Đoạn nghe ${index + 1}`}</Text>
              {item.description ? (
                <Text type="secondary" style={{ fontSize: token.fontSize }}>
                  {item.description}
                </Text>
              ) : null}
              {url ? (
                <audio
                  controls
                  playsInline
                  preload="metadata"
                  src={url}
                  aria-label={item.name || `Đoạn nghe ${index + 1}`}
                  style={{ width: '100%' }}
                >
                  Trình duyệt không hỗ trợ phát audio.
                </audio>
              ) : (
                <Text type="secondary">Không có đường dẫn file nghe.</Text>
              )}
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}

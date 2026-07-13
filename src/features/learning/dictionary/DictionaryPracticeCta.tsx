'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Space } from 'antd';
import { PlayCircleOutlined, ReadOutlined } from '@ant-design/icons';
import type { DictionaryDetailPayload } from '@/types/learning';

type Props = {
  practice: DictionaryDetailPayload['practice'];
};

export function DictionaryPracticeCta({ practice }: Props) {
  const router = useRouter();

  if (!practice) {
    return null;
  }

  if (practice.canPractice) {
    return (
      <Card size="small" title="Luyện tập từ này" className="dictionary-practice-card">
        <Space wrap size="middle" className="dictionary-practice-card__actions">
          {practice.flashcardHref ? (
            <Button
              type="primary"
              icon={<ReadOutlined />}
              size="large"
              block
              className="dictionary-practice-card__btn"
              onClick={() => router.push(practice.flashcardHref!)}
            >
              Ôn flashcard
            </Button>
          ) : null}
          {practice.drillHref ? (
            <Button
              icon={<PlayCircleOutlined />}
              size="large"
              block
              className="dictionary-practice-card__btn"
              onClick={() => router.push(practice.drillHref!)}
            >
              Luyện drill
            </Button>
          ) : null}
        </Space>
      </Card>
    );
  }

  if (practice.reason) {
    return (
      <Alert
        type="info"
        showIcon
        className="dictionary-practice-card"
        message={practice.reason}
        description="Bạn vẫn có thể tra cứu mọi từ trong từ điển; luyện tập chỉ mở với từ trong buổi học đã unlock."
      />
    );
  }

  return null;
}

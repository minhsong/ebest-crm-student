'use client';

import { Card, Space, Tag, Typography } from 'antd';
import { PictureOutlined, SoundOutlined } from '@ant-design/icons';
import type { DictionarySearchItem } from '@/types/learning';
import { VocabularyPosBadge } from '@/features/learning/components/VocabularyPosBadge';

const { Text, Paragraph } = Typography;

type Props = {
  item: DictionarySearchItem;
  onSelect: (assetId: number) => void;
};

export function DictionarySearchCard({ item, onSelect }: Props) {
  return (
    <Card
      hoverable
      size="small"
      className="dictionary-search-card"
      onClick={() => onSelect(item.assetId)}
      styles={{ body: { padding: '14px 16px' } }}
    >
      <div className="dictionary-search-card__top">
        <div className="dictionary-search-card__head">
          <Text strong className="dictionary-search-card__word">
            {item.displayLabel || item.word}
          </Text>
          <VocabularyPosBadge
            partOfSpeech={item.partOfSpeech}
            partOfSpeechLabel={item.partOfSpeechLabel}
          />
        </div>
        <Space size={6} className="dictionary-search-card__icons">
          {item.hasAudio ? <SoundOutlined aria-label="Có audio" /> : null}
          {item.hasImage ? <PictureOutlined aria-label="Có ảnh" /> : null}
        </Space>
      </div>

      <Paragraph
        type="secondary"
        className="dictionary-search-card__meaning"
        ellipsis={{ rows: 2 }}
      >
        {item.translationPreview}
      </Paragraph>

      <Space size={4} wrap className="dictionary-search-card__tags">
        {item.isPrimary && item.siblingCount > 0 ? (
          <Tag color="blue">+{item.siblingCount} biến thể</Tag>
        ) : null}
        {!item.isPrimary ? <Tag>Biến thể</Tag> : null}
      </Space>

      <Text type="secondary" className="dictionary-search-card__hint">
        Xem chi tiết →
      </Text>
    </Card>
  );
}

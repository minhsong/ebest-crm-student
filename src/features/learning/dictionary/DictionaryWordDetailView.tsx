'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DictionaryPracticeCta } from '@/features/learning/dictionary/DictionaryPracticeCta';
import { mapDictionaryDetailToLearningItem } from '@/features/learning/dictionary/dictionary-detail.mapper';
import { VocabularyWordDetailPanel } from '@/features/learning/components/VocabularyWordDetailPanel';
import { useVocabularyAudio } from '@/features/learning/hooks/useVocabularyAudio';
import type { DictionaryLookupSource } from '@/types/learning';
import {
  fetchDictionaryDetail,
  fetchDictionaryProgress,
} from '@/lib/learning-api';
import type {
  DictionaryDetailPayload,
  DictionaryProgressPayload,
} from '@/types/learning';
import '@/features/learning/dictionary/dictionary-lookup.css';
import '@/features/learning/components/session-vocabulary-words.css';

const { Title, Text } = Typography;

type Props = {
  assetId: number;
  lookupSource: DictionaryLookupSource;
  /** Chọn biến thể cùng họ — cập nhật `id` trên URL lookup, không đổi page. */
  onSelectFamilyMember: (assetId: number) => void;
  /** Quay lại danh sách kết quả (giữ search bar + query). */
  onBackToResults?: () => void;
};

export function DictionaryWordDetailView({
  assetId,
  lookupSource,
  onSelectFamilyMember,
  onBackToResults,
}: Props) {
  const [detail, setDetail] = useState<DictionaryDetailPayload | null>(null);
  const [progress, setProgress] = useState<DictionaryProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playingLocale, playAudio, stopAudio } = useVocabularyAudio({ active: true });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchDictionaryDetail(assetId, lookupSource),
      fetchDictionaryProgress(assetId).catch(() => null),
    ])
      .then(([detailPayload, progressPayload]) => {
        if (cancelled) return;
        setDetail(detailPayload);
        setProgress(progressPayload);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetail(null);
        const status = (err as Error & { status?: number })?.status;
        if (status === 404) {
          setError('Từ này không còn trong từ điển.');
        } else if (status === 429) {
          setError('Bạn tra cứu quá nhanh. Vui lòng thử lại sau vài phút.');
        } else {
          setError(err instanceof Error ? err.message : 'Không tải được chi tiết từ.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [assetId, lookupSource, stopAudio]);

  const item = useMemo(
    () => (detail ? mapDictionaryDetailToLearningItem(detail, progress) : null),
    [detail, progress],
  );

  const variantCount = item?.asset.familyMembers?.length ?? 0;
  const wordTitle = item?.asset.displayLabel ?? item?.asset.word;

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (error || !item || !detail) {
    return (
      <div className="dictionary-lookup__detail-panel">
        {onBackToResults ? (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackToResults}
            className="dictionary-lookup__back"
          >
            Quay lại kết quả
          </Button>
        ) : null}
        <Alert type="error" showIcon message={error ?? 'Từ không tồn tại.'} />
      </div>
    );
  }

  return (
    <div className="dictionary-lookup__detail-panel">
      <div className="dictionary-lookup__detail-toolbar">
        {onBackToResults ? (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackToResults}
            className="dictionary-lookup__back"
          >
            Quay lại kết quả
          </Button>
        ) : null}
        <div className="dictionary-lookup__detail-title-block">
          <Title level={4} className="dictionary-lookup__detail-title">
            {wordTitle}
          </Title>
          {variantCount > 1 ? (
            <Text type="secondary" className="dictionary-lookup__detail-sub">
              {variantCount} biến thể trong cùng họ từ — chạm thẻ bên dưới để chuyển
            </Text>
          ) : null}
        </div>
      </div>

      <Space direction="vertical" size="middle" className="dictionary-lookup__detail-stack">
        <Card bordered={false} className="dictionary-detail-card">
          <VocabularyWordDetailPanel
            item={item}
            playingLocale={playingLocale}
            onPlayAudio={playAudio}
            onSelectFamilyMember={onSelectFamilyMember}
            showExtendedDictionaryFields
            hideProgress
            familyPanelMode="dictionary"
          />
        </Card>

        {progress && progress.timesSeen > 0 ? (
          <Card size="small" title="Tiến độ ôn tập (tùy chọn)">
            <Space wrap size="large">
              <span>
                <strong>{progress.masteryLabel}</strong>
              </span>
              <span>Đã xem {progress.timesSeen} lần</span>
              {progress.accuracyRate != null ? (
                <span>Độ chính xác {Math.round(progress.accuracyRate * 100)}%</span>
              ) : null}
            </Space>
          </Card>
        ) : null}

        <DictionaryPracticeCta practice={detail.practice} />
      </Space>
    </div>
  );
}

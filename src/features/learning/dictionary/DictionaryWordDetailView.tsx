'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Card, Skeleton, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { DictionaryPracticeCta } from '@/features/learning/dictionary/DictionaryPracticeCta';
import { mapDictionaryDetailToLearningItem } from '@/features/learning/dictionary/dictionary-detail.mapper';
import { VocabularyWordDetailPanel } from '@/features/learning/components/VocabularyWordDetailPanel';
import { useVocabularyAudio } from '@/features/learning/hooks/useVocabularyAudio';
import {
  dictionaryHomeHref,
  dictionaryWordHref,
  parseDictionaryLookupSource,
} from '@/features/learning/utils/dictionary-routes';
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

type Props = {
  assetId: number;
};

export function DictionaryWordDetailView({ assetId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lookupSource = parseDictionaryLookupSource(searchParams.get('source'));
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

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (error || !item || !detail) {
    return (
      <div className="dictionary-lookup">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(dictionaryHomeHref())}
          className="dictionary-lookup__back"
        >
          Quay lại từ điển
        </Button>
        <Alert type="error" showIcon message={error ?? 'Từ không tồn tại.'} />
      </div>
    );
  }

  return (
    <div className="dictionary-lookup dictionary-lookup--detail">
      <PageHeader
        title={item.asset.displayLabel ?? item.asset.word}
        description={
          variantCount > 1
            ? `${variantCount} biến thể trong cùng họ từ — chạm thẻ bên dưới để chuyển`
            : undefined
        }
        leading={
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(dictionaryHomeHref())}
          >
            Từ điển
          </Button>
        }
      />

      <Space direction="vertical" size="middle" className="dictionary-lookup__detail-stack">
        <Card bordered={false} className="dictionary-detail-card">
          <VocabularyWordDetailPanel
            item={item}
            playingLocale={playingLocale}
            onPlayAudio={playAudio}
            onSelectFamilyMember={(id) =>
              router.push(dictionaryWordHref(id, lookupSource))
            }
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

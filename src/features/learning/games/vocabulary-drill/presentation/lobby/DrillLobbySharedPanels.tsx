'use client';

import Link from 'next/link';
import { Button, Skeleton } from 'antd';
import { ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { LearningAccessNotice } from '@/features/learning/components/LearningAccessNotice';
import { vocabularyLeaderboardHref } from '@/features/learning/utils/vocabulary-session-routes';
import type {
  VocabularyPoolPayload,
  WeakWordsPayload,
} from '@/types/learning';

type Props = {
  pool: VocabularyPoolPayload | null;
  weakWords: WeakWordsPayload | null;
  weakWordsLoading: boolean;
  classId: number | null;
  showWeakWords: boolean;
  onRefresh?: () => void;
};

export function DrillLobbySharedPanels({
  pool,
  weakWords,
  weakWordsLoading,
  classId,
  showWeakWords,
  onRefresh,
}: Props) {
  const poolSize = pool?.poolSize ?? 0;
  const minPool = pool?.minPoolSize ?? 10;

  return (
    <>
      <div className="drill-lobby-panel">
        <div className="drill-lobby-panel__title-row">
          <p className="drill-lobby-section-title">Pool từ vựng</p>
          {pool?.learningAccess?.readOnlyReason && !pool.learningAccess.canRecordEvents ? (
            <LearningAccessNotice message={pool.learningAccess.readOnlyReason} />
          ) : null}
        </div>
        <div className="drill-lobby-pool-row">
          <span className="drill-lobby-pool-chip">
            Tổng <strong>{poolSize}</strong> từ
          </span>
          <span className="drill-lobby-pool-chip">
            Bắt buộc <strong>{pool?.requiredCount ?? 0}</strong>
          </span>
          <span className="drill-lobby-pool-chip">
            Mở rộng <strong>{pool?.extendedCount ?? 0}</strong>
          </span>
        </div>
        {!pool?.practiceEnabled ? (
          <div className="drill-lobby-alert is-warning">
            Cần ít nhất {minPool} từ đã mở khóa để bắt đầu luyện.
          </div>
        ) : null}
      </div>

      {showWeakWords && classId ? (
        <div className="drill-lobby-panel">
          <p className="drill-lobby-section-title">Từ cần ôn thêm</p>
          {weakWordsLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          ) : weakWords?.rows.length ? (
            <div className="drill-lobby-weak-list">
              {weakWords.rows.map((row) => (
                <span key={row.assetId} className="drill-lobby-weak-tag">
                  <span className="drill-lobby-weak-tag__word">{row.word}</span>
                  <span className="drill-lobby-weak-tag__meta">
                    sai {row.wrongCount}/{row.attemptCount}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-slate-400">
              Chơi vài lượt để hệ thống gợi ý từ hay sai.
            </p>
          )}
        </div>
      ) : null}

      <div className="drill-lobby-footer">
        {onRefresh ? (
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            Làm mới
          </Button>
        ) : null}
        {classId ? (
          <Link href={vocabularyLeaderboardHref(classId)}>
            <Button icon={<TrophyOutlined />}>Bảng xếp hạng</Button>
          </Link>
        ) : null}
      </div>
    </>
  );
}

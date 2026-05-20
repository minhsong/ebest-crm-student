'use client';

import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import {
  getAttemptHistoryRowLabel,
  getHistoryScoreText,
  toViDateTime,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { Button, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

export type QuizAttemptHistoryListProps = {
  formPublicId: string;
  rows: QuizAttemptHistoryItem[];
  title: string;
  description?: string;
  vertical?: boolean;
  showScore?: boolean;
  /** Attempt ID đang được highlight (attempt hiện tại đang xem) */
  highlightAttemptId?: string | null;
  /** Callback để refresh danh sách - trả về data mới để update state */
  onRefresh?: () => Promise<QuizAttemptHistoryItem[]>;
};

/**
 * Component hiển thị danh sách các lần làm bài quiz.
 * - Tự động sort theo thời gian mới nhất
 * - Highlight attempt đang được chọn
 * - Hiển thị badge cho attempt mới nhất
 */
export function QuizAttemptHistoryList({
  formPublicId,
  rows,
  title,
  description,
  vertical = false,
  showScore = false,
  highlightAttemptId,
  onRefresh,
}: QuizAttemptHistoryListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sort rows by startedAt DESC (newest first)
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const timeA = new Date(a.startedAt).getTime();
      const timeB = new Date(b.startedAt).getTime();
      return timeB - timeA; // DESC: newest first
    });
  }, [rows]);

  // Xác định attempt nào là mới nhất (dòng đầu tiên sau sort)
  const latestAttemptId = sortedRows[0]?.attemptPublicId ?? null;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  if (!rows.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Typography.Text strong>{title}</Typography.Text>
        {onRefresh && (
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={handleRefresh}
            loading={isRefreshing}
            title="Tải lại danh sách"
          >
            {isRefreshing ? 'Đang tải...' : 'Tải lại'}
          </Button>
        )}
      </div>

      {description && (
        <Typography.Paragraph
          type="secondary"
          style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}
        >
          {description}
        </Typography.Paragraph>
      )}

      <div className={`mt-2 flex ${vertical ? 'flex-col' : 'flex-wrap'} gap-2`}>
        {sortedRows.map((row) => {
          const isLatest = row.attemptPublicId === latestAttemptId;
          const isHighlighted = row.attemptPublicId === highlightAttemptId;

          return (
            <Link
              key={row.attemptPublicId}
              href={`/quiz-test/${formPublicId}/attempts/${row.attemptPublicId}`}
            >
              <Button
                size="small"
                className={vertical ? 'w-full text-left' : undefined}
                type={isHighlighted ? 'primary' : 'default'}
                danger={row.status === 'expired'}
              >
                <Space size={4}>
                  {/* Status icon */}
                  {row.status === 'submitted' ? (
                    <CheckCircleFilled className="text-green-500 text-xs" />
                  ) : row.status === 'expired' ? (
                    <ClockCircleOutlined className="text-red-500 text-xs" />
                  ) : (
                    <ClockCircleOutlined className="text-gray-400 text-xs" />
                  )}

                  {/* Status label & time */}
                  <span>
                    {getAttemptHistoryRowLabel(row.status)} · {toViDateTime(row.startedAt)}
                  </span>

                  {/* Score */}
                  {showScore && (
                    <span className="text-xs opacity-75">{getHistoryScoreText(row)}</span>
                  )}

                  {/* Badge for latest attempt */}
                  {isLatest && (
                    <Tag color="blue" className="m-0 text-[10px] px-1 py-0">
                      Mới nhất
                    </Tag>
                  )}
                </Space>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import {
  getAttemptHistoryRowLabel,
  parseHistoryScore,
  toViDateTime,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { Button, Card, Tag, Tooltip, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

export type QuizAttemptHistoryListProps = {
  formPublicId: string;
  rows: QuizAttemptHistoryItem[];
  title: string;
  description?: ReactNode;
  vertical?: boolean;
  showScore?: boolean;
  highlightAttemptId?: string | null;
  onRefresh?: () => Promise<QuizAttemptHistoryItem[]>;
  /** false = không điều hướng tới trang chi tiết đáp án (D41). */
  allowDetailLinks?: boolean;
  detailAnswersLockedHint?: string | null;
};

function attemptCardClassName(
  status: QuizAttemptHistoryItem['status'],
  isHighlighted: boolean,
): string {
  const base =
    'quiz-attempt-history-card h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]';

  if (isHighlighted) {
    return `${base} !border-[var(--ant-color-primary)] shadow-[0_2px_8px_rgba(22,119,255,0.15)]`;
  }
  if (status === 'expired') {
    return `${base} !border-[var(--ant-color-error-border)] hover:!border-[var(--ant-color-error)]`;
  }
  if (status === 'voided') {
    return `${base} opacity-80 hover:!border-[var(--ant-color-border)]`;
  }
  return `${base} hover:!border-[var(--ant-color-primary)]`;
}

function statusTagColor(status: string): string {
  if (status === 'submitted') return 'success';
  if (status === 'expired') return 'error';
  if (status === 'voided') return 'default';
  return 'processing';
}

export function QuizAttemptHistoryList({
  formPublicId,
  rows,
  title,
  description,
  vertical = false,
  showScore = false,
  highlightAttemptId,
  onRefresh,
  allowDetailLinks = false,
  detailAnswersLockedHint = null,
}: QuizAttemptHistoryListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const answersLocked =
    !allowDetailLinks || Boolean(detailAnswersLockedHint?.trim());

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const timeA = new Date(a.startedAt).getTime();
      const timeB = new Date(b.startedAt).getTime();
      return timeB - timeA;
    });
  }, [rows]);

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
      <div className="flex items-center justify-between gap-2">
        <Typography.Text strong className="text-base text-[var(--ant-color-text-heading)]">
          {title}
        </Typography.Text>
        {onRefresh ? (
          <Button
            type="text"
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={handleRefresh}
            loading={isRefreshing}
            title="Tải lại danh sách"
          >
            {isRefreshing ? 'Đang tải...' : 'Tải lại'}
          </Button>
        ) : null}
      </div>

      {description != null && description !== '' ? (
        <div className="mt-1 mb-0">
          {typeof description === 'string' ? (
            <Typography.Paragraph
              className="mb-0 text-sm text-[var(--ant-color-text)]"
              style={{ marginBottom: 0 }}
            >
              {description}
            </Typography.Paragraph>
          ) : (
            description
          )}
        </div>
      ) : null}

      <div
        className={`mt-3 grid gap-3 ${
          vertical ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {sortedRows.map((row) => {
          const isLatest = row.attemptPublicId === latestAttemptId;
          const isHighlighted = row.attemptPublicId === highlightAttemptId;
          const href = `/quiz-test/${formPublicId}/attempts/${row.attemptPublicId}`;
          const statusLabel = getAttemptHistoryRowLabel(row.status);
          const score = showScore ? parseHistoryScore(row) : null;

          const statusIcon =
            row.status === 'submitted' ? (
              <CheckCircleFilled className="text-lg text-[var(--ant-color-success)]" />
            ) : row.status === 'expired' ? (
              <ClockCircleOutlined className="text-lg text-[var(--ant-color-error)]" />
            ) : row.status === 'voided' ? (
              <ExclamationCircleOutlined className="text-lg text-[var(--ant-color-text-description)]" />
            ) : (
              <ClockCircleOutlined className="text-lg text-[var(--ant-color-text-heading)]" />
            );

          const cardInner = (
                <div className="flex items-stretch gap-4 min-h-[5.5rem]">
                  {/* Trái: tình trạng + thời gian */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag
                        color={statusTagColor(row.status)}
                        className="m-0 px-2.5 py-0.5 text-sm font-medium leading-6"
                        icon={statusIcon}
                      >
                        {statusLabel}
                      </Tag>
                      {isLatest ? (
                        <Tag color="blue" className="m-0 px-2 py-0.5 text-sm font-medium">
                          Mới nhất
                        </Tag>
                      ) : null}
                      {answersLocked ? (
                        <Tooltip
                          title={detailAnswersLockedHint}
                          placement="top"
                          styles={{ root: { maxWidth: 420 } }}
                        >
                          <span
                            className="inline-flex"
                            role="presentation"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <ExclamationCircleOutlined
                              className="text-lg text-[var(--ant-color-warning)]"
                              aria-label="Chưa xem được đáp án chi tiết"
                            />
                          </span>
                        </Tooltip>
                      ) : null}
                    </div>
                    <Typography.Text className="text-[15px] leading-snug text-[var(--ant-color-text)]">
                      {toViDateTime(row.startedAt)}
                    </Typography.Text>
                  </div>

                  {/* Phải: điểm — chữ to, tag % rõ */}
                  <div
                    className={`flex shrink-0 flex-col items-end justify-center gap-1.5 border-l pl-4 ${
                      score
                        ? 'border-[var(--ant-color-border-secondary)]'
                        : 'border-transparent'
                    }`}
                  >
                    {score ? (
                      <>
                        <Typography.Text
                          className="text-right text-[1.75rem] font-bold leading-tight tabular-nums text-[var(--ant-color-text)]"
                        >
                          {score.correct}/{score.total}
                        </Typography.Text>
                        {score.percent != null ? (
                          <Typography.Text className="text-sm text-[var(--ant-color-text)]">
                            {score.percent}%
                          </Typography.Text>
                        ) : null}
                      </>
                    ) : (
                      <Typography.Text
                        type="secondary"
                        className="text-sm text-center"
                      >
                        {row.status === 'expired' ? 'Hết giờ' : '—'}
                      </Typography.Text>
                    )}
                  </div>
                </div>
          );

          const card = (
            <Card
              hoverable={!answersLocked}
              size="small"
              className={`${attemptCardClassName(row.status, isHighlighted)}${
                answersLocked ? ' cursor-not-allowed opacity-[0.92]' : ''
              }`}
              styles={{
                body: {
                  padding: '16px 18px',
                  background:
                    row.status === 'expired'
                      ? 'var(--ant-color-error-bg)'
                      : isHighlighted
                        ? 'var(--ant-color-primary-bg)'
                        : 'var(--ant-color-bg-container)',
                },
              }}
            >
              {cardInner}
            </Card>
          );

          if (answersLocked) {
            return (
              <Tooltip
                key={row.attemptPublicId}
                title={
                  detailAnswersLockedHint?.trim() ||
                  'Chưa đủ điều kiện xem chi tiết đáp án (hết lượt hoặc đạt 100%).'
                }
                placement="top"
                styles={{ root: { maxWidth: 420 } }}
              >
                <div
                  className="block w-full"
                  role="presentation"
                  aria-label={`Lần làm ${toViDateTime(row.startedAt)} — chưa xem được chi tiết đáp án`}
                >
                  {card}
                </div>
              </Tooltip>
            );
          }

          return (
            <Link
              key={row.attemptPublicId}
              href={href}
              className="group block w-full no-underline text-inherit"
              aria-label={`Xem chi tiết bài làm ${toViDateTime(row.startedAt)}`}
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

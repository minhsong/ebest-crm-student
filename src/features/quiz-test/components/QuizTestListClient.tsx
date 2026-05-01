'use client';

import { Alert, Button, Card, Empty, List, Skeleton, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  toQuizProgressMap,
  toQuizPublishedFormSummaries,
} from '@/features/quiz-test/lib/quiz-runtime-response-mappers';
import { buildQuizListItemUiState } from '@/features/quiz-test/lib/quiz-list-item-state';
import { formatDuration } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizAttemptProgressItem, QuizPublishedFormSummary } from '@/features/quiz-test/types';

export function QuizTestListClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QuizPublishedFormSummary[]>([]);
  const [progressByForm, setProgressByForm] = useState<Record<string, QuizAttemptProgressItem>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = quizRuntimePublicUrl('forms');
      const { ok: listOk, status: listStatus, data } = await fetchQuizRuntimeJson<{
        items?: unknown;
        message?: string;
      }>(url);
      if (!listOk) {
        const msg =
          typeof data === 'object' && data && 'message' in data
            ? String((data as { message?: unknown }).message ?? `HTTP ${listStatus}`)
            : `HTTP ${listStatus}`;
        throw new Error(msg);
      }
      const next = toQuizPublishedFormSummaries(data.items);
      setItems(next);

      const ids = next.map((x) => x.formPublicId).filter(Boolean);
      if (ids.length > 0) {
        const q = new URLSearchParams({ formPublicIds: ids.join(',') });
        const progressUrl = `${quizRuntimePublicUrl('progress')}?${q.toString()}`;
        const pr = await fetchQuizRuntimeJson<{ items?: unknown[] }>(progressUrl);
        setProgressByForm(pr.ok ? toQuizProgressMap(pr.data.items) : {});
      } else {
        setProgressByForm({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách đề.');
      setItems([]);
      setProgressByForm({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refetchIfVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', refetchIfVisible);
    document.addEventListener('visibilitychange', refetchIfVisible);
    return () => {
      window.removeEventListener('focus', refetchIfVisible);
      document.removeEventListener('visibilitychange', refetchIfVisible);
    };
  }, [load]);

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Bài ôn / kiểm tra
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0, maxWidth: 560 }}>
            Chọn đề bên dưới để bắt đầu hoặc tiếp tục phần bạn đang làm.
          </Typography.Paragraph>
        </div>
        <Button onClick={() => load()} loading={loading} size="small">
          Làm mới danh sách
        </Button>
      </div>

      {error ? <Alert type="error" showIcon className="mb-4" message={error} /> : null}

      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}

      {!loading && !error && items.length === 0 ? (
        <Empty description="Hiện chưa có đề khả dụng." />
      ) : null}

      {!loading && items.length > 0 ? (
        <List
          dataSource={items}
          renderItem={(row) => {
            const progress = progressByForm[row.formPublicId];
            const { actionLabel, buttonType, statusLine } = buildQuizListItemUiState(progress);

            const descriptionTail = (
              <span className="text-neutral-600">
                Thời lượng: {formatDuration(row.durationSeconds)}
                {statusLine ? (
                  <>
                    <br />
                    {statusLine}
                  </>
                ) : null}
              </span>
            );

            return (
              <List.Item
                actions={[
                  <Link key="go" href={`/quiz-test/${row.formPublicId}`}>
                    <Button type={buttonType}>{actionLabel}</Button>
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={row.name || `Đề #${row.crmFormId}`}
                  description={descriptionTail}
                />
              </List.Item>
            );
          }}
        />
      ) : null}
    </Card>
  );
}

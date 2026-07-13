'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AutoComplete,
  Card,
  Empty,
  Input,
  Pagination,
  Skeleton,
  Spin,
  Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { DictionarySearchCard } from '@/features/learning/dictionary/DictionarySearchCard';
import { useDictionarySuggest } from '@/features/learning/hooks/useDictionarySuggest';
import { useDictionarySearch } from '@/features/learning/hooks/useDictionarySearch';
import {
  dictionarySearchHref,
  dictionaryWordHref,
} from '@/features/learning/utils/dictionary-routes';
import type { DictionarySuggestItem } from '@/types/learning';
import '@/features/learning/dictionary/dictionary-lookup.css';

const { Paragraph, Text } = Typography;

export function DictionaryLookupView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get('q') ?? '';
  const pageFromUrl = Number(searchParams.get('page') ?? '1');

  const [input, setInput] = useState(queryFromUrl);

  const { items: suggestItems, loading: suggestLoading } = useDictionarySuggest(input);
  const { items, loading, error, pagination } = useDictionarySearch(
    queryFromUrl,
    pageFromUrl,
  );

  useEffect(() => {
    setInput(queryFromUrl);
  }, [queryFromUrl]);

  const suggestOptions = useMemo(
    () =>
      suggestItems.map((item: DictionarySuggestItem) => ({
        value: String(item.assetId),
        label: (
          <div className="dictionary-lookup__suggest-option">
            <Text strong>{item.displayLabel}</Text>
            <Text type="secondary"> — {item.translationPreview}</Text>
          </div>
        ),
        item,
      })),
    [suggestItems],
  );

  const runSearch = (value?: string) => {
    const q = (value ?? input).trim();
    if (q.length < 2) return;
    router.push(dictionarySearchHref(q));
  };

  const onSuggestSelect = (assetId: string) => {
    const id = Number(assetId);
    if (!Number.isFinite(id)) return;
    router.push(dictionaryWordHref(id, 'suggest'));
  };

  const hasQuery = queryFromUrl.trim().length >= 2;

  return (
    <div className="dictionary-lookup">
      <PageHeader title="Từ điển Ebest" />
      <Paragraph type="secondary" className="dictionary-lookup__intro">
        Tra cứu toàn bộ từ vựng đã xuất bản — gõ tiếng Anh hoặc nghĩa tiếng Việt.
      </Paragraph>

      <div className="dictionary-lookup__search-sticky">
        <Card size="small" bordered={false} className="dictionary-lookup__search-card">
          <AutoComplete
            className="dictionary-lookup__autocomplete"
            value={input}
            options={input.trim().length >= 2 ? suggestOptions : []}
            onSelect={onSuggestSelect}
            onChange={setInput}
            notFoundContent={
              input.trim().length < 2 ? null : suggestLoading ? (
                <Spin size="small" />
              ) : (
                'Không có gợi ý phù hợp'
              )
            }
          >
            <Input.Search
              size="large"
              placeholder="Nhập từ tiếng Anh hoặc nghĩa tiếng Việt..."
              prefix={<SearchOutlined />}
              enterButton="Tìm"
              allowClear
              onSearch={runSearch}
            />
          </AutoComplete>
        </Card>
      </div>

      {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}

      {!hasQuery ? (
        <Empty description="Nhập ít nhất 2 ký tự để bắt đầu tra cứu." />
      ) : loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : items.length ? (
        <>
          <Text type="secondary" className="dictionary-lookup__result-meta">
            {pagination.total} kết quả cho «{queryFromUrl.trim()}»
          </Text>
          <div className="dictionary-lookup__grid">
            {items.map((item) => (
              <DictionarySearchCard
                key={item.assetId}
                item={item}
                onSelect={(assetId) =>
                  router.push(dictionaryWordHref(assetId, 'search'))
                }
              />
            ))}
          </div>
          {pagination.totalPages > 1 ? (
            <Pagination
              className="dictionary-lookup__pagination"
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger={false}
              onChange={(page) => {
                const params = new URLSearchParams({
                  q: queryFromUrl.trim(),
                  page: String(page),
                });
                router.push(`/learning/dictionary?${params.toString()}`);
              }}
            />
          ) : null}
        </>
      ) : (
        <Empty description="Không tìm thấy từ phù hợp trong từ điển Ebest." />
      )}
    </div>
  );
}

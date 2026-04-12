'use client';

import { PageCard, PageHeader } from '@/components/layout';
import { useStudentQaList } from '../hooks/use-student-qa';
import { QA_LIST_PAGE_DESCRIPTION } from '../lib/seo';
import { Flex, Input, Space } from 'antd';
import { useCallback, useState } from 'react';

import { QaListCards } from './QaListCards';

export function QaListPageClient() {
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const { loading, data } = useStudentQaList({ q });

  const onSearch = useCallback(() => {
    setQ(qInput.trim());
  }, [qInput]);

  return (
    <>
      <PageHeader
        title="Hỏi đáp / Knowledge base"
        description={QA_LIST_PAGE_DESCRIPTION}
      />
      <PageCard>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Flex wrap="wrap" gap="small" align="center">
            <Input.Search
              allowClear
              placeholder="Tìm theo tiêu đề"
              style={{ maxWidth: 320 }}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onSearch={onSearch}
            />
          </Flex>
          <QaListCards items={data?.data ?? []} loading={loading} />
        </Space>
      </PageCard>
    </>
  );
}

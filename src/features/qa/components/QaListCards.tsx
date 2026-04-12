'use client';

import type { StudentPortalQaListItem } from '../lib/types';
import { EyeOutlined } from '@ant-design/icons';
import {
  Card,
  Empty,
  Flex,
  List,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import Link from 'next/link';
import { useMemo } from 'react';

export type QaListCardsProps = {
  items: StudentPortalQaListItem[];
  loading?: boolean;
};

export function QaListCards({ items, loading = false }: QaListCardsProps) {
  const { token } = theme.useToken();

  const listLocale = useMemo(
    () => ({
      emptyText: <Empty description="Chưa có bài viết nào." />,
    }),
    [],
  );

  return (
    <List<StudentPortalQaListItem>
      rowKey="id"
      loading={loading}
      dataSource={items}
      split={false}
      locale={listLocale}
      renderItem={(item, index) => {
        const n = index + 1;
        const reads = item.portalReadCount ?? 0;
        const href = `/qa/${encodeURIComponent(item.slug)}`;
        const hasTags = Boolean(item.tags?.length);

        return (
          <List.Item style={{ padding: 0, marginBottom: token.marginSM }}>
            <Link href={href} style={{ width: '100%', color: 'inherit' }}>
              <Card hoverable size="small">
                <Flex gap="small" align="flex-start" wrap={false}>
                  <Typography.Text type="secondary" style={{ flexShrink: 0 }}>
                    {n}.
                  </Typography.Text>
                  <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
                    <Flex
                      justify="space-between"
                      align="flex-start"
                      gap="small"
                      wrap="wrap"
                    >
                      <Typography.Title
                        level={5}
                        ellipsis={{ rows: 2 }}
                        style={{ margin: 0, flex: '1 1 auto', minWidth: 0 }}
                      >
                        {item.title}
                      </Typography.Title>
                      <Tag icon={<EyeOutlined />} style={{ margin: 0 }}>
                        {reads.toLocaleString('vi-VN')}
                      </Tag>
                    </Flex>
                    {hasTags ? (
                      <Space size={[4, 4]} wrap>
                        {item.tags!.map((tag) => (
                          <Tag
                            key={tag.id}
                            color={tag.color || undefined}
                            style={{ margin: 0 }}
                          >
                            {tag.name}
                          </Tag>
                        ))}
                      </Space>
                    ) : null}
                  </Flex>
                </Flex>
              </Card>
            </Link>
          </List.Item>
        );
      }}
    />
  );
}

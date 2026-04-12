'use client';

import { PageCard, PageHeader } from '@/components/layout';
import { useStudentQaBySlug } from '../hooks/use-student-qa';
import { STUDENT_QA_VISIBILITY_LABEL } from '../lib/labels';
import { APP_BRAND } from '@/lib/ui-constants';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Spin, Tag } from 'antd';
import Link from 'next/link';
import { useEffect } from 'react';

import { QaArticleHtml } from './QaArticleHtml';

export type QaDetailPageClientProps = {
  slug: string;
};

export function QaDetailPageClient({ slug }: QaDetailPageClientProps) {
  const { loading, article } = useStudentQaBySlug(slug || undefined);

  useEffect(() => {
    if (!article?.title) return;
    const previous = document.title;
    document.title = `${article.title} | ${APP_BRAND}`;
    return () => {
      document.title = previous;
    };
  }, [article?.title]);

  if (!slug) {
    return (
      <PageCard>
        <p>Đường dẫn không hợp lệ.</p>
        <Link href="/qa">
          <Button type="link">Về danh sách</Button>
        </Link>
      </PageCard>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return (
      <PageCard>
        <p>Không tìm thấy bài viết.</p>
        <Link href="/qa">
          <Button type="link">Về danh sách</Button>
        </Link>
      </PageCard>
    );
  }

  return (
    <>
      <PageHeader
        leading={
          <Link href="/qa">
            <Button type="default" icon={<ArrowLeftOutlined />}>
              Danh sách
            </Button>
          </Link>
        }
        title={article.title}
      />
      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag>
            {STUDENT_QA_VISIBILITY_LABEL[article.visibility] ??
              article.visibility}
          </Tag>
          <Tag
            icon={<EyeOutlined />}
            className="border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {(article.portalReadCount ?? 0).toLocaleString('vi-VN')}
          </Tag>
          {article.tags?.map((t) => (
            <Tag key={t.id} color={t.color || undefined}>
              {t.name}
            </Tag>
          ))}
        </div>
        <QaArticleHtml html={article.content} />
      </PageCard>
    </>
  );
}

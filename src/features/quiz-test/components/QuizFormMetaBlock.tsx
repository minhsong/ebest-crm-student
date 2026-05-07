'use client';

import { formatQuizFormTypeVi } from '@/features/quiz-test/lib/quiz-form-meta';
import { Tag, Typography } from 'antd';
import { memo } from 'react';

export type QuizFormMetaBlockProps = {
  /** `original` | `random` | … */
  formType?: string | null;
  catalogKey?: string | null;
  /** Breadcrumb danh mục từ CRM (ưu tiên hiển thị). */
  catalogPath?: string | null;
  /** Tag taxonomy gom từ các câu trong đề. */
  tagKeys: string[];
  /** Chuỗi dạng « Thời lượng làm bài: 90 phút » — tùy màn không truyền. */
  durationSummary?: string;
  /** Giao diện gọn cho header lúc đang làm bài. */
  compact?: boolean;
};

/** Thông tin chung của đề: loại, danh mục, tags, (tuỳ chọn) thời lượng. */
export const QuizFormMetaBlock = memo(function QuizFormMetaBlock({
  formType,
  catalogKey,
  catalogPath,
  tagKeys,
  durationSummary,
  compact,
}: QuizFormMetaBlockProps) {
  const typeLabel = formatQuizFormTypeVi(formType);
  const catalogDisplay = catalogPath?.trim() || catalogKey?.trim() || '';

  const tagCls = compact ? 'text-xs leading-tight' : '';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {typeLabel ? (
          <Tag color="blue" className={tagCls}>
            Loại đề · {typeLabel}
          </Tag>
        ) : null}
        {catalogDisplay ? (
          <Tag color="default" className={tagCls}>
            Danh mục · {catalogDisplay}
          </Tag>
        ) : null}
        {tagKeys.map((key) => (
          <Tag key={key} color="geekblue" className={tagCls}>
            {key}
          </Tag>
        ))}
      </div>
      {durationSummary ? (
        <Typography.Text type="secondary" style={{ marginBottom: 0 }} className={compact ? '!text-xs' : undefined}>
          {durationSummary}
        </Typography.Text>
      ) : null}
    </div>
  );
});

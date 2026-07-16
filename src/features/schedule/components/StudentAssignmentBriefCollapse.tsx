'use client';

import { Collapse } from 'antd';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';

type StudentAssignmentBriefCollapseProps = {
  html: string;
  /** Mặc định thu gọn để ưu tiên bài viết / nhận xét. */
  defaultExpanded?: boolean;
};

/** Yêu cầu / mô tả bài tập — collapse để gọn UI. */
export function StudentAssignmentBriefCollapse({
  html,
  defaultExpanded = false,
}: StudentAssignmentBriefCollapseProps) {
  const trimmed = html.trim();
  if (!trimmed) return null;

  return (
    <Collapse
      size="small"
      defaultActiveKey={defaultExpanded ? ['brief'] : []}
      items={[
        {
          key: 'brief',
          label: 'Yêu cầu bài tập',
          children: <QaArticleHtml html={trimmed} />,
        },
      ]}
    />
  );
}

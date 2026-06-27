'use client';

import { Collapse, theme } from 'antd';

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
  const { token } = theme.useToken();
  const trimmed = html.trim();
  if (!trimmed) return null;

  return (
    <>
      <style>{`
        .student-assignment-brief a { color: ${token.colorLink}; }
        .student-assignment-brief img { max-width: 100%; height: auto; }
      `}</style>
      <Collapse
        size="small"
        defaultActiveKey={defaultExpanded ? ['brief'] : []}
        items={[
          {
            key: 'brief',
            label: 'Yêu cầu bài tập',
            children: (
              <div
                className="student-assignment-brief"
                style={{
                  fontSize: token.fontSize,
                  lineHeight: 1.6,
                  color: token.colorText,
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: trimmed }}
              />
            ),
          },
        ]}
      />
    </>
  );
}

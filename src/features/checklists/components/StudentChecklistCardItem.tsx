'use client';

import { Button, Card, Space, Tag, Typography, theme } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import type { StudentChecklistListRow } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';

const { Text } = Typography;

export function StudentChecklistCardItem(props: {
  row: StudentChecklistListRow;
  onOpenDetail: (checklistId: number) => void;
  /** Nếu true: ẩn dòng lớp (dùng trong tab checklist theo lớp). */
  hideClassCode?: boolean;
}) {
  const { token } = theme.useToken();
  const { row, onOpenDetail, hideClassCode = false } = props;

  const typeLabel = checklistTypeLabel(row.typeKey);
  const titleText = row.title || '';
  const line1 = titleText ? `${typeLabel} · ${titleText}` : typeLabel;

  const classCode = row.classCode?.trim();
  const sessionTitle = row.classSessionTitle?.trim();
  const line2Parts = [
    hideClassCode ? '' : classCode || 'Lớp học',
    sessionTitle || '',
  ].filter(Boolean);
  const line2 = line2Parts.join(' · ');

  return (
    <Card
      size="small"
      styles={{ body: { padding: '10px 12px' } }}
      style={{
        border: '1px solid #f0f0f0',
        borderRadius: token.borderRadiusLG,
        marginBottom: 8,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Text strong className="block truncate" title={line1}>
            {line1}
          </Text>
          {line2 ? (
            <Text
              type="secondary"
              className="mt-0.5 block truncate"
              style={{ fontSize: token.fontSizeSM }}
              title={line2}
            >
              {line2}
            </Text>
          ) : null}

          <Space size="small" wrap className="mt-2">
            <Tag color={row.checked ? 'green' : 'orange'} className="m-0">
              {row.checked ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
            </Tag>
            {row.deadlineAt ? (
              <Tag className="m-0">
                Deadline: {new Date(row.deadlineAt).toLocaleString('vi-VN')}
              </Tag>
            ) : null}
          </Space>
        </div>

        <Button
          icon={<RightOutlined />}
          onClick={() => onOpenDetail(row.checklistId)}
          className="cursor-pointer flex-shrink-0"
          size="small"
        >
          Xem
        </Button>
      </div>
    </Card>
  );
}


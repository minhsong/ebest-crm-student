'use client';

import { Flex, Tag, Typography, theme } from 'antd';
import { useRouter } from 'next/navigation';
import { CRM_CLASS_SESSION_STATUS } from '@/lib/crm-enums';
import { formatSessionTimeShort } from '@/lib/session-format';
import type { SessionWithClassMeta } from '@/lib/dashboard-schedule-helpers';

const { Text } = Typography;

function statusAccent(
  token: ReturnType<typeof theme.useToken>['token'],
  status: number,
) {
  if (status === CRM_CLASS_SESSION_STATUS.READY) return token.colorPrimary;
  if (status === CRM_CLASS_SESSION_STATUS.IN_PROGRESS) return token.colorSuccess;
  if (status === CRM_CLASS_SESSION_STATUS.COMPLETED) return token.colorTextQuaternary;
  return token.colorBorderSecondary;
}

const tagStyle = { margin: 0, maxWidth: '100%', fontSize: 11 } as const;

export type StudentWeekSessionCellProps = {
  item: SessionWithClassMeta;
};

export function StudentWeekSessionCell({ item }: StudentWeekSessionCellProps) {
  const { token } = theme.useToken();
  const router = useRouter();
  const { row, className, classCode } = item;
  const title = row.title?.trim() || 'Buổi học';
  const accent = statusAccent(token, row.sessionStatus);
  const tintedBg =
    accent.startsWith('#') && /^#[0-9a-fA-F]{6}$/.test(accent)
      ? `${accent}1a`
      : token.colorFillAlter;

  const goSchedule = () => {
    router.push('/schedule');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goSchedule}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goSchedule();
        }
      }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderRadius: token.borderRadius,
        border: `2px solid ${accent}`,
        background: tintedBg,
        padding: `${token.paddingXS}px ${token.paddingSM}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        textAlign: 'left',
      }}
    >
      <Text strong style={{ fontSize: 12, color: token.colorText, lineHeight: 1.35 }}>
        {formatSessionTimeShort(row.scheduledStartTime)} –{' '}
        {formatSessionTimeShort(row.scheduledEndTime)}
      </Text>
      <Text
        strong
        ellipsis={{ tooltip: title }}
        style={{ fontSize: 12, margin: 0, color: token.colorText, lineHeight: 1.3 }}
      >
        {title}
      </Text>
      <Text
        type="secondary"
        ellipsis={{ tooltip: `${className} (${classCode})` }}
        style={{ fontSize: 11, lineHeight: 1.3, margin: 0 }}
      >
        {className}{' '}
        <span style={{ fontWeight: 500 }}>({classCode})</span>
      </Text>
      <Flex wrap="wrap" gap={6} align="center">
        <Text
          type="secondary"
          style={{ fontSize: 11, fontWeight: 600, margin: 0, flexShrink: 0 }}
        >
          GV:
        </Text>
        {row.teacherDisplayName?.trim() ? (
          row.teacherTagColor ? (
            <Tag color={row.teacherTagColor} style={tagStyle}>
              {row.teacherDisplayName.trim()}
            </Tag>
          ) : (
            <Text style={{ fontSize: 11, margin: 0 }}>{row.teacherDisplayName.trim()}</Text>
          )
        ) : (
          <Text type="secondary" style={{ fontSize: 11, margin: 0 }}>
            —
          </Text>
        )}
        <Text
          type="secondary"
          style={{ fontSize: 11, fontWeight: 600, margin: 0, flexShrink: 0 }}
        >
          Phòng:
        </Text>
        {row.classroomTagColor != null ? (
          <Tag color={row.classroomTagColor} style={tagStyle}>
            {row.classroomName?.trim() || '—'}
          </Tag>
        ) : row.classroomName?.trim() ? (
          <Text style={{ fontSize: 11, margin: 0 }}>{row.classroomName.trim()}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 11, margin: 0 }}>
            —
          </Text>
        )}
      </Flex>
    </div>
  );
}

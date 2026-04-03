'use client';

import { memo, type CSSProperties, type ReactNode } from 'react';
import {
  Card,
  Divider,
  Flex,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { OverviewClassSessions } from '@/types/overview-sessions';
import { antdTagColorForClassStatus } from '@/lib/session-tag-colors';
import { SessionCard } from '@/features/schedule/components/SessionCard';

const { Text } = Typography;

const staffLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const squareTagStyle: CSSProperties = {
  margin: 0,
  maxWidth: '100%',
  borderRadius: 0,
  border: 'none',
  height: 'auto',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  textAlign: 'left',
  lineHeight: 1.35,
  padding: '2px 8px',
  fontSize: 12,
  fontWeight: 500,
};

export type ClassSessionBlockProps = {
  block: OverviewClassSessions;
  /** Ví dụ: link «Xem lịch đầy đủ» trên Tổng quan */
  headerExtra?: ReactNode;
};

function ClassSessionBlockInner({ block, headerExtra }: ClassSessionBlockProps) {
  const { token } = theme.useToken();

  if (!block.sessions?.length) {
    return null;
  }

  const statusLabel = block.classStatusLabel?.trim() || '—';
  const homeroom = block.homeroomTeacherDisplayName?.trim() ?? '';
  const staffNames = (block.supportStaffDisplayNames ?? []).filter(Boolean);
  const showStaffRow = homeroom || staffNames.length > 0;

  return (
    <section>
      <Card
        size="small"
        variant="outlined"
        styles={{
          body: { padding: `${token.paddingSM}px ${token.padding}px` },
        }}
      >
        <Flex vertical gap={token.marginSM}>
          <Flex
            justify="space-between"
            align="flex-start"
            wrap="wrap"
            gap={token.marginXS}
          >
            <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
              <Flex wrap align="center" gap={token.marginXS}>
                <Text strong style={{ fontSize: token.fontSize }}>
                  {block.className}{' '}
                  <Text type="secondary" style={{ fontWeight: 400 }}>
                    ({block.classCode})
                  </Text>
                </Text>
                <Tag color={antdTagColorForClassStatus(block.classStatus ?? 0)}>
                  {statusLabel}
                </Tag>
              </Flex>
              <Text
                type="secondary"
                style={{ fontSize: token.fontSizeSM, lineHeight: 1.4 }}
              >
                {block.courseName}
              </Text>
            </Flex>
            {headerExtra ? (
              <div style={{ flexShrink: 0, fontSize: token.fontSize }}>
                {headerExtra}
              </div>
            ) : null}
          </Flex>

          {showStaffRow ? (
            <>
              <Divider style={{ margin: 0 }} />
              <Flex wrap align="center" gap={token.marginXS}>
                {homeroom ? (
                  <Flex wrap align="center" gap={token.marginXS} style={{ minWidth: 0 }}>
                    <Text type="secondary" style={staffLabelStyle}>
                      Chủ Nhiệm
                    </Text>
                    <Tag color="green" style={squareTagStyle}>
                      {homeroom}
                    </Tag>
                  </Flex>
                ) : null}
                {homeroom && staffNames.length > 0 ? (
                  <Divider
                    type="vertical"
                    style={{
                      margin: `0 ${token.marginXS}px`,
                      height: 16,
                      borderColor: token.colorBorderSecondary,
                    }}
                  />
                ) : null}
                {staffNames.length > 0 ? (
                  <Flex wrap align="center" gap={token.marginXS} style={{ minWidth: 0 }}>
                    <Text type="secondary" style={staffLabelStyle}>
                      Giáo vụ
                    </Text>
                    <Flex wrap gap={6} style={{ minWidth: 0 }}>
                      {staffNames.map((name, idx) => (
                        <Tag
                          key={`${name}-${idx}`}
                          color="blue"
                          style={squareTagStyle}
                        >
                          {name}
                        </Tag>
                      ))}
                    </Flex>
                  </Flex>
                ) : null}
              </Flex>
            </>
          ) : null}
        </Flex>
      </Card>
      <Space
        direction="vertical"
        size={10}
        style={{ width: '100%', marginTop: token.marginSM }}
      >
        {block.sessions.map((row, index) => (
          <SessionCard
            key={row.sessionId}
            row={row}
            stripedDim={index % 2 === 0}
          />
        ))}
      </Space>
    </section>
  );
}

export const ClassSessionBlock = memo(ClassSessionBlockInner);

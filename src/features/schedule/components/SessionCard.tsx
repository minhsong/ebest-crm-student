'use client';

import { memo, useState, type CSSProperties } from 'react';
import { Button, Card, Divider, Flex, Tag, Typography, theme } from 'antd';
import type { OverviewSessionRow } from '@/types/overview-sessions';
import { formatSessionDatetimeCompact } from '@/lib/session-format';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import {
  AppstoreOutlined,
  AudioOutlined,
  BookOutlined,
  CheckSquareOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOutlined,
  MessageOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { SessionStatusTag } from '@/features/dashboard/components/SessionStatusTag';
import { AttendanceCell } from '@/features/dashboard/components/AttendanceCell';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import { StudentSessionMaterialsModal } from '@/features/schedule/components/StudentSessionMaterialsModal';

const { Text, Paragraph } = Typography;

export type SessionCardProps = {
  row: OverviewSessionRow;
  /** Buổi ở vị trí chẵn (0,2,4…): nền card hơi đậm để tách với buổi lẻ */
  stripedDim?: boolean;
  /** Mã lớp — hiển thị trong title (khi có). */
  classCode?: string;
};

function assignmentResultShort(resultStatus: number | null): string {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'Đã chấm';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'Đã nộp';
  return 'Chưa nộp';
}

function assignmentTypeShort(exerciseType: string | null | undefined): string {
  const t = String(exerciseType ?? '').trim().toLowerCase();
  if (!t) return 'Bài tập';
  if (t === 'recording') return 'Ghi âm';
  if (t === 'paper') return 'Giấy';
  if (t === 'toeic') return 'TOEIC';
  if (t === 'writing') return 'Viết';
  if (t === 'speaking') return 'Nói';
  if (t === 'homework') return 'Homework';
  if (t === 'quiz') return 'Quiz';
  if (t === 'general') return 'Bài tập';
  return 'Bài tập';
}

function assignmentTypeIcon(exerciseType: string | null | undefined) {
  const t = String(exerciseType ?? '').trim().toLowerCase();
  if (t === 'recording') return <AudioOutlined aria-hidden />;
  if (t === 'paper') return <FileTextOutlined aria-hidden />;
  if (t === 'toeic') return <TrophyOutlined aria-hidden />;
  if (t === 'writing') return <EditOutlined aria-hidden />;
  if (t === 'speaking') return <MessageOutlined aria-hidden />;
  if (t === 'homework') return <BookOutlined aria-hidden />;
  if (t === 'quiz') return <CheckSquareOutlined aria-hidden />;
  return <AppstoreOutlined aria-hidden />;
}

const tagCellStyle: CSSProperties = { margin: 0, maxWidth: '100%' };
const squareTagStyle: CSSProperties = {
  margin: 0,
  maxWidth: '100%',
  borderRadius: 6,
  paddingInline: 8,
};

function SessionCardInner({ row, stripedDim, classCode }: SessionCardProps) {
  const { token } = theme.useToken();
  const labelColor = token.colorText;
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAssignmentId, setDetailAssignmentId] = useState<number | null>(
    null,
  );
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const assistants = row.assistantTeachers?.length
    ? row.assistantTeachers
    : [];
  const assignments = row.assignments ?? [];

  const openDetail = (assignmentId: number) => {
    setDetailAssignmentId(assignmentId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailAssignmentId(null);
  };

  const cardBodyBg = stripedDim
    ? token.colorPrimaryBg
    : token.colorBgContainer;

  return (
    <>
      <Card
        size="small"
        variant="outlined"
        style={{
          boxShadow: token.boxShadowSecondary,
        }}
        styles={{
          body: {
            padding: `${token.paddingSM}px ${token.padding}px`,
            background: cardBodyBg,
          },
        }}
      >
        <Flex vertical gap={token.marginSM}>
          <Flex vertical gap={6}>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
              <Flex align="center" wrap="wrap" gap={6} style={{ minWidth: 0, flex: '1 1 12rem' }}>
                {classCode?.trim() ? (
                  <Tag color="blue" style={squareTagStyle}>
                    {classCode.trim()}
                  </Tag>
                ) : null}
                <Tag
                  color={row.isTutoringSession ? 'magenta' : 'blue'}
                  style={squareTagStyle}
                >
                  {row.isTutoringSession ? 'Buổi kèm' : 'Chính thức'}
                </Tag>
                <Paragraph
                  strong
                  ellipsis={{ rows: 2 }}
                  style={{
                    flex: '1 1 12rem',
                    minWidth: 0,
                    margin: 0,
                    fontSize: token.fontSize,
                    lineHeight: token.lineHeight,
                  }}
                >
                  {row.title?.trim() || 'Buổi học'}
                </Paragraph>
              </Flex>

              <Flex wrap="wrap" gap={6} align="center" style={{ flexShrink: 0 }}>
                <Button
                  color="cyan"
                  variant="solid"
                  size="small"
                  icon={<FolderOutlined />}
                  onClick={() => setMaterialsOpen(true)}
                >
                  Tài liệu
                </Button>
                <SessionStatusTag
                  status={row.sessionStatus}
                  label={row.sessionStatusLabel}
                />
                <AttendanceCell
                  status={row.attendanceStatus}
                  label={row.attendanceLabel}
                />
              </Flex>
            </Flex>

            <Flex wrap="wrap" gap={6} align="center">
              <Text strong style={{ fontSize: token.fontSizeSM }}>
                {formatSessionDatetimeCompact(
                  row.scheduledDate,
                  row.scheduledStartTime,
                  row.scheduledEndTime,
                )}
              </Text>
              {row.teacherDisplayName?.trim() ? (
                <Tag
                  color={row.teacherTagColor ?? 'default'}
                  style={{ ...tagCellStyle, fontSize: token.fontSizeSM }}
                >
                  {row.teacherDisplayName.trim()}
                </Tag>
              ) : null}
              {assistants.length > 0 ? (
                <Flex wrap="wrap" gap={4} align="center">
                  {assistants.map((a, idx) => (
                    <Tag
                      key={`${a.displayName}-${idx}`}
                      color={a.tagColor}
                      style={{ ...tagCellStyle, fontSize: token.fontSizeSM }}
                    >
                      {a.displayName}
                    </Tag>
                  ))}
                </Flex>
              ) : null}
              {row.classroomName?.trim() ? (
                <Tag
                  color={row.classroomTagColor ?? 'default'}
                  style={{ ...tagCellStyle, fontSize: token.fontSizeSM }}
                >
                  {row.classroomName.trim()}
                </Tag>
              ) : null}
            </Flex>
          </Flex>

          {assignments.length > 0 ? (
            <>
              <Divider style={{ margin: 0 }} />
              <Flex vertical gap={6} style={{ width: '100%' }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    color: labelColor,
                  }}
                >
                  Bài tập
                </Text>
                <Flex vertical gap={6} style={{ width: '100%' }}>
                  {assignments.map((a) => {
                    const title = a.title?.trim() || 'Bài tập';
                    const typeShort = assignmentTypeShort(a.exerciseType);
                    const statusShort = assignmentResultShort(a.resultStatus);
                    const score = a.scoreDisplay?.trim() || '—';
                    return (
                      <Button
                        key={a.assignmentId}
                        type="default"
                        size="small"
                        onClick={() => openDetail(a.assignmentId)}
                        style={{
                          height: 'auto',
                          width: '100%',
                          paddingBlock: 6,
                          paddingInline: 10,
                          textAlign: 'start',
                        }}
                      >
                        <Flex
                          align="center"
                          gap={10}
                          wrap="nowrap"
                          style={{ width: '100%', minWidth: 0 }}
                        >
                          <Tag
                            color="default"
                            style={{
                              margin: 0,
                              borderRadius: token.borderRadiusSM,
                              paddingInline: 8,
                              fontSize: token.fontSizeSM,
                              flexShrink: 0,
                            }}
                          >
                            <Flex align="center" gap={6}>
                              {assignmentTypeIcon(a.exerciseType)}
                              <span>{typeShort}</span>
                            </Flex>
                          </Tag>
                          <Text
                            strong
                            ellipsis={{ tooltip: title }}
                            style={{
                              flex: '1 1 auto',
                              minWidth: 0,
                              margin: 0,
                              fontSize: token.fontSizeSM,
                            }}
                          >
                            {title}
                          </Text>
                          <Tag
                            color={
                              a.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED
                                ? 'blue'
                                : a.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED
                                  ? 'processing'
                                  : 'default'
                            }
                            style={{
                              margin: 0,
                              borderRadius: token.borderRadiusSM,
                              paddingInline: 8,
                              fontSize: token.fontSizeSM,
                              flexShrink: 0,
                            }}
                          >
                            {statusShort}
                          </Tag>
                          <Text
                            strong
                            style={{
                              margin: 0,
                              fontSize: token.fontSizeSM,
                              flexShrink: 0,
                            }}
                          >
                            {score}
                          </Text>
                        </Flex>
                      </Button>
                    );
                  })}
                </Flex>
              </Flex>
            </>
          ) : null}
        </Flex>
      </Card>

      <StudentAssignmentDetailModal
        open={detailOpen}
        assignmentId={detailAssignmentId}
        onClose={closeDetail}
      />

      <StudentSessionMaterialsModal
        open={materialsOpen}
        sessionId={row.sessionId}
        sessionTitle={row.title ?? undefined}
        onClose={() => setMaterialsOpen(false)}
      />
    </>
  );
}

export const SessionCard = memo(SessionCardInner);

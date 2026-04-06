'use client';

import { memo, useState, type CSSProperties } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { OverviewSessionRow } from '@/types/overview-sessions';
import { formatSessionDatetimeCompact } from '@/lib/session-format';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import { FolderOutlined } from '@ant-design/icons';
import { SessionStatusTag } from '@/features/dashboard/components/SessionStatusTag';
import { AttendanceCell } from '@/features/dashboard/components/AttendanceCell';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import { StudentSessionMaterialsModal } from '@/features/schedule/components/StudentSessionMaterialsModal';

const { Text, Paragraph } = Typography;

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

export type SessionCardProps = {
  row: OverviewSessionRow;
  /** Buổi ở vị trí chẵn (0,2,4…): nền card hơi đậm để tách với buổi lẻ */
  stripedDim?: boolean;
  /** VD. tên lớp + mã — hiển thị trên Tổng quan khi gom nhiều lớp */
  classContextLabel?: string;
};

function assignmentResultShort(resultStatus: number | null): string {
  return resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED
    ? 'Đã chấm'
    : 'Chờ chấm';
}

const tagCellStyle: CSSProperties = { margin: 0, maxWidth: '100%' };

function SessionCardInner({ row, stripedDim, classContextLabel }: SessionCardProps) {
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
          <Flex vertical gap={4}>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
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
              <Flex wrap="wrap" gap={8} align="center" style={{ flexShrink: 0 }}>
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
            {classContextLabel ? (
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                {classContextLabel}
              </Text>
            ) : null}
          </Flex>

          <Divider style={{ margin: 0 }} />

          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ ...labelStyle, color: labelColor }}>
                  Ngày giờ
                </Text>
                <Text strong style={{ fontSize: token.fontSizeSM }}>
                  {formatSessionDatetimeCompact(
                    row.scheduledDate,
                    row.scheduledStartTime,
                    row.scheduledEndTime,
                  )}
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ ...labelStyle, color: labelColor }}>
                  Giáo viên
                </Text>
                {row.teacherDisplayName?.trim() ? (
                  row.teacherTagColor ? (
                    <Tag
                      color={row.teacherTagColor}
                      style={{ ...tagCellStyle, fontSize: token.fontSizeSM }}
                    >
                      {row.teacherDisplayName.trim()}
                    </Tag>
                  ) : (
                    <Text style={{ fontSize: token.fontSizeSM }}>
                      {row.teacherDisplayName.trim()}
                    </Text>
                  )
                ) : (
                  <Text style={{ fontSize: token.fontSizeSM }}>—</Text>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ ...labelStyle, color: labelColor }}>
                  Trợ giảng
                </Text>
                {assistants.length > 0 ? (
                  <Flex wrap="wrap" gap={4}>
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
                ) : (
                  <Text style={{ fontSize: token.fontSizeSM }}>—</Text>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ ...labelStyle, color: labelColor }}>
                  Phòng
                </Text>
                {row.classroomTagColor != null ? (
                  <Tag
                    color={row.classroomTagColor}
                    style={{ ...tagCellStyle, fontSize: token.fontSizeSM }}
                  >
                    {row.classroomName?.trim() || 'Phòng học'}
                  </Tag>
                ) : (
                  <Text style={{ fontSize: token.fontSizeSM }}>—</Text>
                )}
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: 0 }} />

          <Flex align="center" wrap="wrap" gap={8}>
            <Text style={{ ...labelStyle, color: labelColor }}>Bài tập</Text>
            <Flex wrap="wrap" gap={8} style={{ flex: 1, minWidth: 0 }}>
              {assignments.length === 0 ? (
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  Chưa có bài tập
                </Text>
              ) : (
                assignments.map((a) => {
                  const title = a.title?.trim() || 'Bài tập';
                  const graded =
                    a.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED;
                  const showScore =
                    a.scoreDisplay != null && a.scoreDisplay !== '';
                  const btnBg = graded ? token.colorSuccess : token.colorWarning;
                  const btnBorder = graded
                    ? token.colorSuccessBorder
                    : token.colorWarningBorder;
                  return (
                    <Button
                      key={a.assignmentId}
                      type="default"
                      size="middle"
                      onClick={() => openDetail(a.assignmentId)}
                      style={{
                        height: 'auto',
                        maxWidth: '100%',
                        minWidth: 200,
                        paddingBlock: 10,
                        paddingInline: 14,
                        textAlign: 'start',
                        fontWeight: 600,
                        background: btnBg,
                        borderColor: btnBorder,
                        color: token.colorTextLightSolid,
                      }}
                    >
                      <Flex
                        align="center"
                        wrap="wrap"
                        gap={10}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                      >
                        <Text
                          strong
                          ellipsis={{ tooltip: title }}
                          style={{
                            flex: '1 1 160px',
                            minWidth: 0,
                            margin: 0,
                            color: token.colorTextLightSolid,
                            fontSize: token.fontSize,
                            lineHeight: token.lineHeight,
                          }}
                        >
                          {title}
                        </Text>
                        <Flex
                          align="center"
                          wrap="nowrap"
                          gap={8}
                          style={{ flexShrink: 0 }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              lineHeight: 1.4,
                              padding: '2px 10px',
                              borderRadius: token.borderRadiusSM,
                              background: 'rgba(255,255,255,0.28)',
                              color: token.colorTextLightSolid,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {assignmentResultShort(a.resultStatus)}
                          </span>
                          {showScore ? (
                            <Text
                              strong
                              style={{
                                margin: 0,
                                color: token.colorTextLightSolid,
                                fontSize: token.fontSizeLG,
                                lineHeight: 1.2,
                              }}
                            >
                              {a.scoreDisplay}
                            </Text>
                          ) : null}
                        </Flex>
                      </Flex>
                    </Button>
                  );
                })
              )}
            </Flex>
          </Flex>
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

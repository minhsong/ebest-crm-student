'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Descriptions,
  Space,
  Typography,
  Button,
  Spin,
  Tag,
  Flex,
  Card,
  theme,
} from 'antd';
import {
  ExportOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import type {
  StudentAssignmentAttachment,
  StudentAssignmentDetail,
} from '@/types/student-assignment-detail';
import {
  buildAssignmentSessionLine,
  getResourceKindLabel,
} from '@/lib/assignment-display';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import { normalizeStudentAssignmentDetail } from '@/lib/student-assignment-detail-normalize';
import {
  assignmentAttachmentOpenTabLabel,
  assignmentAttachmentPlayVariant,
  assignmentAttachmentSupportsImagePreview,
  assignmentAttachmentSupportsPlay,
} from '@/lib/media-play-utils';
import { StudentMediaPlayModal } from '@/features/schedule/components/StudentMediaPlayModal';

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  assignmentId: number | null;
  onClose: () => void;
};

export function StudentAssignmentDetailModal({
  open,
  assignmentId,
  onClose,
}: Props) {
  const { token } = theme.useToken();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<StudentAssignmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [playOpen, setPlayOpen] = useState(false);
  const [playTitle, setPlayTitle] = useState('');
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [playVariant, setPlayVariant] = useState<'audio' | 'video' | 'image'>(
    'video',
  );

  const closePlay = useCallback(() => {
    setPlayOpen(false);
    setPlayUrl(null);
  }, []);

  const openAttachmentViewer = useCallback(
    (item: StudentAssignmentAttachment) => {
      const u = item.url?.trim();
      if (!u) return;
      setPlayTitle(item.name || 'Xem');
      setPlayVariant(assignmentAttachmentPlayVariant(item));
      setPlayUrl(u);
      setPlayOpen(true);
    },
    [],
  );

  useEffect(() => {
    if (!open || assignmentId == null) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setError(null);
    setLoading(true);

    void (async () => {
      try {
        const res = await fetchWithAuth(`/api/assignments/${assignmentId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            typeof data?.message === 'string'
              ? data.message
              : 'Không tải được chi tiết bài tập.';
          if (!cancelled) {
            setError(msg);
            setLoading(false);
          }
          return;
        }
        const normalized = normalizeStudentAssignmentDetail(data);
        if (!cancelled) {
          if (normalized) {
            setDetail(normalized);
          } else {
            setError('Dữ liệu bài tập không hợp lệ.');
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Lỗi mạng. Vui lòng thử lại.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, assignmentId, fetchWithAuth]);

  const sessionLine = detail
    ? buildAssignmentSessionLine(
        detail.courseSessionTitle,
        detail.classSessionTitle,
      )
    : '';

  const htmlContentStyles = `
    .student-assignment-html a { color: ${token.colorLink}; }
    .student-assignment-html img { max-width: 100%; height: auto; }
  `;

  return (
    <>
    <Modal
      title={
        detail ? (
          <span style={{ paddingRight: token.paddingSM }}>
            Bài tập: {detail.title}
          </span>
        ) : (
          'Chi tiết bài tập'
        )
      }
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Đóng
        </Button>
      }
      width={720}
      destroyOnClose
    >
      {loading && (
        <Flex justify="center" align="center" style={{ padding: '40px 0' }}>
          <Spin tip="Đang tải..." />
        </Flex>
      )}
      {error && !loading && <Text type="danger">{error}</Text>}
      {!loading && !error && detail && (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {sessionLine ? (
            <Text type="secondary" style={{ fontSize: token.fontSize }}>
              {sessionLine}
            </Text>
          ) : null}

          <Descriptions
            column={{ xs: 1, sm: 2 }}
            bordered
            size="small"
            labelStyle={{ fontWeight: 600, width: 130 }}
          >
            <Descriptions.Item label="Loại bài">
              {detail.typeLabel}
            </Descriptions.Item>
            {detail.exerciseTypeLabel && (
              <Descriptions.Item label="Dạng bài tập">
                {detail.exerciseTypeLabel}
              </Descriptions.Item>
            )}
            {detail.scoringTypeLabel && (
              <Descriptions.Item label="Cách chấm">
                {detail.scoringTypeLabel}
              </Descriptions.Item>
            )}
            {detail.deadline && (
              <Descriptions.Item label="Deadline">
                {new Date(detail.deadline).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Kết quả của bạn">
              {detail.result?.resultStatus ===
              CRM_ASSIGNMENT_RESULT_STATUS.GRADED ? (
                <Space wrap size="small">
                  <Tag color="blue">Đã chấm</Tag>
                  {detail.result?.scoreDisplay != null &&
                    detail.result.scoreDisplay !== '' && (
                      <span>
                        Điểm: <strong>{detail.result?.scoreDisplay}</strong>
                      </span>
                    )}
                </Space>
              ) : (
                <Text type="secondary">Chờ chấm / chưa có điểm</Text>
              )}
            </Descriptions.Item>
          </Descriptions>

          {detail.content ? (
            <div>
              <Title
                level={5}
                style={{
                  marginTop: token.marginSM,
                  marginBottom: token.marginXS,
                }}
              >
                Nội dung / mô tả
              </Title>
              <style>{htmlContentStyles}</style>
              <Card
                size="small"
                variant="borderless"
                styles={{
                  body: {
                    minHeight: 48,
                    background: token.colorFillAlter,
                    fontSize: token.fontSize,
                  },
                }}
              >
                <div
                  className="student-assignment-html"
                  dangerouslySetInnerHTML={{ __html: detail.content }}
                />
              </Card>
            </div>
          ) : null}

          {detail.attachments?.length ? (
            <div>
              <Title
                level={5}
                style={{
                  marginTop: token.marginSM,
                  marginBottom: token.marginXS,
                }}
              >
                Tài liệu đính kèm ({detail.attachments.length})
              </Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {detail.attachments.map((item, index) => {
                  const canPlay = assignmentAttachmentSupportsPlay(item);
                  const canPreviewImage =
                    assignmentAttachmentSupportsImagePreview(item);
                  const url = item.url?.trim() ?? '';
                  return (
                    <Card
                      key={`${item.id ?? item.fileId ?? url}-${index}`}
                      size="small"
                      type="inner"
                      styles={{
                        body: {
                          fontSize: token.fontSize,
                          paddingBlock: token.paddingSM,
                        },
                      }}
                    >
                      <Flex wrap="wrap" gap={token.marginSM} align="center">
                        {item.resourceKind &&
                          getResourceKindLabel(item.resourceKind) && (
                            <Tag color="green">
                              {getResourceKindLabel(item.resourceKind)}
                            </Tag>
                          )}
                        <Text strong style={{ flex: '1 1 180px', minWidth: 0 }}>
                          {item.name}
                        </Text>
                        <Space wrap>
                          {canPlay && url ? (
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={() => openAttachmentViewer(item)}
                            >
                              Phát
                            </Button>
                          ) : null}
                          {canPreviewImage && url && !canPlay ? (
                            <Button
                              type="primary"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => openAttachmentViewer(item)}
                            >
                              Xem
                            </Button>
                          ) : null}
                          {url ? (
                            <Button
                              size="small"
                              icon={<ExportOutlined />}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {assignmentAttachmentOpenTabLabel(item)}
                            </Button>
                          ) : null}
                        </Space>
                      </Flex>
                      {item.description ? (
                        <Text
                          type="secondary"
                          style={{
                            display: 'block',
                            marginTop: token.marginXS,
                            fontSize: token.fontSizeSM,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </Card>
                  );
                })}
              </Space>
            </div>
          ) : null}

          {!detail.content &&
            (!detail.attachments || detail.attachments.length === 0) && (
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: `${token.paddingLG}px 0`,
                }}
              >
                Không có nội dung hoặc tệp đính kèm.
              </Text>
            )}
        </Space>
      )}

    </Modal>
    <StudentMediaPlayModal
      open={playOpen}
      title={playTitle}
      playUrl={playUrl}
      variant={playVariant}
      onClose={closePlay}
    />
    </>
  );
}

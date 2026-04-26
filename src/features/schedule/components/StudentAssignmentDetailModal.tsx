'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Descriptions,
  Space,
  Typography,
  Input,
  Button,
  Spin,
  Tag,
  Flex,
  Card,
  theme,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  ExportOutlined,
  FileTextOutlined,
  AudioOutlined,
  TrophyOutlined,
  EditOutlined,
  MessageOutlined,
  BookOutlined,
  CheckSquareOutlined,
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
import { StudentSubmissionAudioRecorder } from '@/features/schedule/components/StudentSubmissionAudioRecorder';
import { isAllowedStudentSubmissionMime } from '@/lib/student-submission-mime';

const { Text, Title } = Typography;

const SUBMISSION_MIME_REJECT_DETAIL =
  'có định dạng không được phép (âm thanh, ảnh, video, PDF, Office…).';

function assertSubmissionFilesMimeAllowed(files: File[]): boolean {
  for (const f of files) {
    if (!isAllowedStudentSubmissionMime(f.type)) {
      message.error(`File "${f.name}" ${SUBMISSION_MIME_REJECT_DETAIL}`);
      return false;
    }
  }
  return true;
}

type StudentAssignmentDetailModalProps = {
  open: boolean;
  assignmentId: number | null;
  onClose: () => void;
};

export function StudentAssignmentDetailModal({
  open,
  assignmentId,
  onClose,
}: StudentAssignmentDetailModalProps) {
  const { token } = theme.useToken();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<StudentAssignmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const loadDetail = useCallback(async () => {
    if (assignmentId == null) return;
    const res = await fetchWithAuth(`/api/assignments/${assignmentId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        typeof data?.message === 'string'
          ? data.message
          : 'Không tải được chi tiết bài tập.';
      setError(msg);
      setDetail(null);
      return;
    }
    const normalized = normalizeStudentAssignmentDetail(data);
    if (normalized) {
      setDetail(normalized);
      setError(null);
      return;
    }
    setError('Dữ liệu bài tập không hợp lệ.');
    setDetail(null);
  }, [assignmentId, fetchWithAuth]);

  useEffect(() => {
    if (!open || assignmentId == null) {
      setDetail(null);
      setError(null);
      setLoading(false);
      setSubmissionNote('');
      return;
    }

    let cancelled = false;
    setDetail(null);
    setError(null);
    setLoading(true);
    setSubmissionNote('');

    void (async () => {
      try {
        await loadDetail();
        if (!cancelled) setLoading(false);
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
  }, [open, assignmentId, loadDetail]);

  const maxUploadFiles = Math.min(
    5,
    Math.max(1, detail?.studentUploadMaxFiles ?? 1),
  );

  const headerStatusTag = useMemo(() => {
    const st = detail?.result?.resultStatus ?? null;
    if (st === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) {
      return <Tag color="blue">Đã chấm</Tag>;
    }
    if (st === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) {
      return <Tag color="processing">Đã nộp</Tag>;
    }
    return <Tag>Chưa nộp</Tag>;
  }, [detail?.result?.resultStatus]);

  const headerExerciseIcon = useMemo(() => {
    const t = (detail?.exerciseType ?? '').trim().toLowerCase();
    if (t === 'recording') return <AudioOutlined aria-hidden />;
    if (t === 'paper') return <FileTextOutlined aria-hidden />;
    if (t === 'toeic') return <TrophyOutlined aria-hidden />;
    if (t === 'writing') return <EditOutlined aria-hidden />;
    if (t === 'speaking') return <MessageOutlined aria-hidden />;
    if (t === 'homework') return <BookOutlined aria-hidden />;
    if (t === 'quiz') return <CheckSquareOutlined aria-hidden />;
    return <AppstoreOutlined aria-hidden />;
  }, [detail?.exerciseType]);

  const submissionAttachmentCount = useMemo(
    () => detail?.submission?.attachments?.length ?? 0,
    [detail?.submission?.attachments?.length],
  );

  const submitFiles = useCallback(
    async (files: File[]): Promise<boolean> => {
      if (!files.length || assignmentId == null) return false;

      if (!assertSubmissionFilesMimeAllowed(files)) return false;

      const hasExisting = submissionAttachmentCount > 0;
      if (hasExisting) {
        const ok = window.confirm(
          'Bạn đang nộp lại bài. Toàn bộ file bài nộp cũ sẽ bị xoá. Bạn có chắc chắn không?',
        );
        if (!ok) return false;
      }

      const form = new FormData();
      for (const f of files) {
        form.append('files', f);
      }
      const note = submissionNote.trim();
      if (note) {
        form.append('note', note);
      }
      if (files.length === 1) {
        const f0 = files[0]!;
        form.append('name', f0.name);
        const mime = (f0.type ?? '').toLowerCase();
        form.append(
          'resourceKind',
          mime.startsWith('audio/') ? 'audio' : 'document',
        );
      }

      setSubmitting(true);
      try {
        const res = await fetchWithAuth(
          `/api/assignments/${assignmentId}/submission`,
          {
            method: 'POST',
            body: form,
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data?.message === 'string' ? data.message : 'Nộp bài thất bại.';
          message.error(msg);
          return false;
        }
        message.success('Đã nộp bài.');
        setSubmissionNote('');
        await loadDetail();
        return true;
      } catch {
        message.error('Lỗi mạng. Vui lòng thử lại.');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      assignmentId,
      fetchWithAuth,
      loadDetail,
      submissionAttachmentCount,
      submissionNote,
    ],
  );

  const handleSubmitRecording = useCallback(
    (file: File) => submitFiles([file]),
    [submitFiles],
  );

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(e.target.files ?? []);
      e.target.value = '';
      if (!list.length || assignmentId == null) return;

      if (list.length > maxUploadFiles) {
        message.error(`Chỉ được chọn tối đa ${maxUploadFiles} file.`);
        return;
      }
      await submitFiles(list);
    },
    [assignmentId, maxUploadFiles, submitFiles],
  );

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
    <input
      ref={fileInputRef}
      type="file"
      multiple={maxUploadFiles > 1}
      accept="audio/*,image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
      style={{ display: 'none' }}
      onChange={handleFileSelected}
    />
    <Modal
      title={
        detail ? (
          <Flex align="center" wrap="wrap" gap={8} style={{ paddingRight: token.paddingSM }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1,
                fontSize: 16,
                color: token.colorTextSecondary,
              }}
              title={detail.exerciseTypeLabel ?? undefined}
            >
              {headerExerciseIcon}
            </span>
            <span style={{ fontWeight: 700 }}>{detail.title}</span>
            {headerStatusTag}
          </Flex>
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
            <Descriptions.Item label="Điểm">
              <Space size="small" wrap>
                {detail.result?.scoreDisplay != null &&
                detail.result.scoreDisplay !== '' ? (
                  <span>
                    Điểm: <strong>{detail.result?.scoreDisplay}</strong>
                  </span>
                ) : (
                  <span>Điểm: —</span>
                )}
                {detail.scoringTypeLabel ? (
                  <Tag style={{ margin: 0 }}>{detail.scoringTypeLabel}</Tag>
                ) : null}
                {detail.scoringMaxScore != null ? (
                  <Tag style={{ margin: 0 }}>Max: {detail.scoringMaxScore}</Tag>
                ) : null}
              </Space>
            </Descriptions.Item>
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
          </Descriptions>

          {detail.studentUploadEnabled &&
          detail.result?.resultStatus !== CRM_ASSIGNMENT_RESULT_STATUS.GRADED ? (
            <Card size="small">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Nộp bài trực tiếp</div>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    Tối đa {maxUploadFiles} file mỗi lần, mỗi file tối đa 20MB (âm
                    thanh, ảnh, video, PDF, Office…). Nộp lại sẽ thay toàn bộ bài
                    cũ.
                  </Text>
                  <Input.TextArea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Ghi chú (tuỳ chọn)"
                    style={{ marginTop: token.marginSM }}
                    disabled={submitting}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                  />
                </div>
                <Flex wrap="wrap" gap={8} align="center">
                  <StudentSubmissionAudioRecorder
                    disabled={submitting}
                    onSubmitRecording={handleSubmitRecording}
                  />
                  <Button
                    type="primary"
                    loading={submitting}
                    onClick={handlePickFile}
                  >
                    {detail.result?.resultStatus ===
                    CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED
                      ? 'Upload file'
                      : 'Chọn file'}
                  </Button>
                </Flex>
              </Flex>
            </Card>
          ) : null}

          {detail.submission?.attachments?.length ? (
            <div>
              <Title
                level={5}
                style={{
                  marginTop: token.marginSM,
                  marginBottom: token.marginXS,
                }}
              >
                Bài nộp của bạn
              </Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {detail.submission.submittedAt ? (
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    Nộp lúc:{' '}
                    {new Date(detail.submission.submittedAt).toLocaleString(
                      'vi-VN',
                      {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </Text>
                ) : null}
                {detail.submission.submittedNote ? (
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    Ghi chú: {detail.submission.submittedNote}
                  </Text>
                ) : null}
                {detail.submission.attachments.map((a) => (
                  <Card
                    key={a.id}
                    size="small"
                    styles={{ body: { padding: token.paddingSM } }}
                  >
                    <Flex justify="space-between" align="center" gap="middle">
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>
                          {a.name}
                        </div>
                        {a.note ? (
                          <Text type="secondary" style={{ fontSize: token.fontSize }}>
                            {a.note}
                          </Text>
                        ) : null}
                      </div>
                      <Space size="small">
                        {assignmentAttachmentSupportsPlay({
                          type: 'file',
                          name: a.name,
                          url: a.url,
                          mimeType: a.mimeType ?? undefined,
                          resourceKind: a.resourceKind as any,
                        }) ? (
                          <Button
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() =>
                              openAttachmentViewer({
                                type: 'file',
                                name: a.name,
                                url: a.url,
                                mimeType: a.mimeType ?? undefined,
                                resourceKind: a.resourceKind as any,
                              })
                            }
                          >
                            Phát
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            icon={<ExportOutlined />}
                            onClick={() => window.open(a.url, '_blank')}
                          >
                            Mở
                          </Button>
                        )}
                      </Space>
                    </Flex>
                  </Card>
                ))}
              </Space>
            </div>
          ) : null}

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

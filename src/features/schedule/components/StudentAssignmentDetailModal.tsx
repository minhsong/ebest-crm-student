'use client';

import Link from 'next/link';
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
  Alert,
  theme,
  message,
  Popconfirm,
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
  LinkOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { AssignmentQuizActionButtons } from '@/features/quiz-test/components/AssignmentQuizActionButtons';
import { LearningAccessNotice } from '@/features/learning/components/LearningAccessNotice';
import { useAuth } from '@/contexts/auth-context';
import type {
  StudentAssignmentAttachment,
  StudentAssignmentDetail,
  StudentSubmissionAttachment,
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
import { StudentOpenInNewTabLink } from '@/components/ui/StudentOpenInNewTabLink';
import { StudentMediaPlayModal } from '@/features/schedule/components/StudentMediaPlayModal';
import { StudentSubmissionMediaReviewModal } from '@/features/schedule/components/StudentSubmissionMediaReviewModal';
import { StudentTeacherFeedbackCard } from '@/features/schedule/components/StudentTeacherFeedbackCard';
import { StudentSubmissionReviewList } from '@/features/schedule/components/StudentSubmissionReviewList';
import { sortComments } from '@/components/media-review';
import { isMediaSpeakingExercise } from '@/lib/speaking-assignment';
import { StudentSubmissionAudioRecorder } from '@/features/schedule/components/StudentSubmissionAudioRecorder';
import {
  getFileInputAccept,
  getSubmissionMaxBytes,
  getSubmissionMaxBytesLabel,
  isExternalLinkExerciseType,
  isSubmissionMimeAllowed,
} from '@/lib/student-submission-policy';
import { QuizAssignmentUiMessages } from '@/lib/quiz-assignment-ui-messages';
import { StudentWritingSubmissionPanel } from '@/features/schedule/components/StudentWritingSubmissionPanel';
import {
  buildVocabularyDrillStartHref,
  isVocabularyDrillAssignment,
} from '@/lib/assignment-list-row-actions';
import {
  isWritingExerciseType,
  isWritingDictationMode,
  pickDictationAudioAttachments,
  parseWritingExerciseMode,
} from '@/lib/writing-assignment';

const { Text, Title } = Typography;
const SUBMISSION_MIME_REJECT_DETAIL =
  'có định dạng không được phép (chỉ hỗ trợ âm thanh, ảnh, video).';

function assertSubmissionFilesMimeAllowed(
  files: File[],
  externalLinkImageOnly: boolean,
): boolean {
  for (const f of files) {
    if (!isSubmissionMimeAllowed(f.type, externalLinkImageOnly)) {
      message.error(
        externalLinkImageOnly
          ? `File "${f.name}" không phải ảnh (chỉ jpg, png, …).`
          : `File "${f.name}" ${SUBMISSION_MIME_REJECT_DETAIL}`,
      );
      return false;
    }
  }
  return true;
}

function assertSubmissionFilesSizeAllowed(
  files: File[],
  externalLinkImageOnly: boolean,
): boolean {
  const maxBytes = getSubmissionMaxBytes(externalLinkImageOnly);
  const label = getSubmissionMaxBytesLabel(externalLinkImageOnly);
  for (const f of files) {
    if (f.size > maxBytes) {
      message.error(`File "${f.name}" vượt quá ${label}.`);
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
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [externalSubmissionUrl, setExternalSubmissionUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [playOpen, setPlayOpen] = useState(false);
  const [playTitle, setPlayTitle] = useState('');
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [playVariant, setPlayVariant] = useState<'audio' | 'video' | 'image'>(
    'video',
  );
  const [mediaReviewOpen, setMediaReviewOpen] = useState(false);
  const [mediaReviewAtt, setMediaReviewAtt] = useState<
    (StudentSubmissionAttachment & { label: string }) | null
  >(null);

  const closePlay = useCallback(() => {
    setPlayOpen(false);
    setPlayUrl(null);
  }, []);

  const openAttachmentViewer = useCallback(
    (item: StudentAssignmentAttachment) => {
      const u = item.url?.trim();
      if (!u) return;
      setPlayTitle(item.name || 'Xem');
      setPlayVariant(
        assignmentAttachmentPlayVariant({
          type: item.type,
          name: item.name,
          url: u,
          mimeType: item.mimeType,
          resourceKind: item.resourceKind,
        }),
      );
      setPlayUrl(u);
      setPlayOpen(true);
    },
    [],
  );

  const openTimelineReview = useCallback(
    (a: StudentSubmissionAttachment, label: string) => {
      const u = a.url?.trim();
      if (!u) return;
      setMediaReviewAtt({
        ...a,
        label,
        url: u,
        mediaReviewComments: sortComments(a.mediaReviewComments ?? []),
      });
      setMediaReviewOpen(true);
    },
    [],
  );

  const openPlainPlay = useCallback(
    (a: StudentSubmissionAttachment, label: string) => {
      const u = a.url?.trim();
      if (!u) return;
      setPlayTitle(label);
      setPlayVariant(
        assignmentAttachmentPlayVariant({
          type: 'file',
          name: a.name,
          url: u,
          mimeType: a.mimeType ?? undefined,
          resourceKind: a.resourceKind as StudentAssignmentAttachment['resourceKind'],
        }),
      );
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
      setExternalSubmissionUrl(
        normalized.submission?.submittedExternalUrl?.trim() ?? '',
      );
      setSubmissionNote(normalized.submission?.submittedNote?.trim() ?? '');
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
    setExternalSubmissionUrl('');

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

  const isQuizWithLinkedForm = useMemo(() => {
    if (!detail) return false;
    const pub = detail.testQuizFormPublicId?.trim();
    return (
      (detail.exerciseType ?? '').toLowerCase() === 'quiz' &&
      typeof pub === 'string' &&
      pub.length > 0
    );
  }, [detail]);

  const isExternalLinkExercise = useMemo(
    () => isExternalLinkExerciseType(detail?.exerciseType),
    [detail?.exerciseType],
  );

  const isWritingExercise = useMemo(
    () => isWritingExerciseType(detail?.exerciseType),
    [detail?.exerciseType],
  );
  const writingDictationAudios = useMemo(
    () =>
      isWritingDictationMode(detail?.writingMode)
        ? pickDictationAudioAttachments(detail?.attachments)
        : [],
    [detail?.attachments, detail?.writingMode],
  );

  const quizAttemptSummary = useMemo(() => {
    if (!detail || !isQuizWithLinkedForm) return null;
    const max = detail.quizMaxAttempts ?? null;
    const remaining = detail.quizAttemptsRemaining ?? null;
    const submitted = detail.quizSubmittedCount ?? null;
    if (max != null && remaining != null) {
      return QuizAssignmentUiMessages.attemptsRemaining(remaining, max);
    }
    if (max != null && typeof submitted === 'number') {
      return `Đã làm ${submitted}/${max} lượt.`;
    }
    if (max != null) {
      return `Tối đa ${max} lượt làm bài.`;
    }
    return QuizAssignmentUiMessages.attemptsUnlimited;
  }, [detail, isQuizWithLinkedForm]);

  const canSubmit = detail?.learningAccess?.canSubmit !== false;
  const canStartQuiz = detail?.learningAccess?.canStartQuiz !== false;
  const readOnlyReason = detail?.learningAccess?.readOnlyReason ?? null;

  const quizCardDescription = useMemo(() => {
    if (!detail) return '';
    if (canStartQuiz) {
      const hasPriorAttempt =
        (detail.quizSubmittedCount ?? 0) > 0 ||
        detail.result?.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED;
      return hasPriorAttempt
        ? `${QuizAssignmentUiMessages.quizRetakeHint}${quizAttemptSummary ? ` ${quizAttemptSummary}` : ''}`
        : `${QuizAssignmentUiMessages.quizIntro}${quizAttemptSummary ? ` ${quizAttemptSummary}` : ''}`;
    }
    if (quizAttemptSummary) return quizAttemptSummary;
    return 'Xem lại các lần làm qua «Xem kết quả».';
  }, [canStartQuiz, detail, quizAttemptSummary]);

  const deadlinePassed = useMemo(() => {
    if (!detail?.deadline) return false;
    const t = new Date(detail.deadline).getTime();
    return Number.isFinite(t) && t < Date.now();
  }, [detail?.deadline]);

  const isVocabularyDrillExercise = useMemo(
    () => (detail ? isVocabularyDrillAssignment(detail) : false),
    [detail],
  );

  const vocabularyDrillStartHref = useMemo(() => {
    if (!detail?.classId || !Number.isFinite(detail.classId)) return null;
    return buildVocabularyDrillStartHref(detail.classId, detail.assignmentId);
  }, [detail?.assignmentId, detail?.classId]);

  const canStartVocabularyDrill = useMemo(() => {
    if (!isVocabularyDrillExercise || !vocabularyDrillStartHref) return false;
    if (deadlinePassed) return false;
    return !detail?.learningAccess?.readOnlyReason;
  }, [
    deadlinePassed,
    detail?.learningAccess?.readOnlyReason,
    isVocabularyDrillExercise,
    vocabularyDrillStartHref,
  ]);

  const vocabularyDrillCardDescription = useMemo(() => {
    if (!detail) return '';
    if (canStartVocabularyDrill) {
      const hasScore =
        detail.result?.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED ||
        Boolean(detail.result?.scoreDisplay?.trim());
      return hasScore
        ? 'Chơi lại để cải thiện điểm — kết quả đồng bộ sổ điểm sau khi hoàn thành.'
        : 'Luyện từ theo pool GV giao — hoàn thành để nộp điểm vào sổ điểm.';
    }
    if (detail.learningAccess?.readOnlyReason) {
      return detail.learningAccess.readOnlyReason;
    }
    if (deadlinePassed) {
      return 'Đã quá hạn — chỉ xem lại thông tin bài.';
    }
    return 'Không mở được game luyện từ cho bài này.';
  }, [canStartVocabularyDrill, deadlinePassed, detail]);

  const headerExerciseIcon = useMemo(() => {
    const t = (detail?.exerciseType ?? '').trim().toLowerCase();
    if (t === 'recording') return <AudioOutlined aria-hidden />;
    if (t === 'paper') return <FileTextOutlined aria-hidden />;
    if (t === 'toeic') return <TrophyOutlined aria-hidden />;
    if (t === 'writing') return <EditOutlined aria-hidden />;
    if (t === 'speaking') return <MessageOutlined aria-hidden />;
    if (t === 'homework') return <BookOutlined aria-hidden />;
    if (t === 'quiz') return <CheckSquareOutlined aria-hidden />;
    if (t === 'external_link') return <LinkOutlined aria-hidden />;
    if (t === 'vocabulary_drill') return <ThunderboltOutlined aria-hidden />;
    return <AppstoreOutlined aria-hidden />;
  }, [detail?.exerciseType]);

  const submissionAttachmentCount = useMemo(
    () => detail?.submission?.attachments?.length ?? 0,
    [detail?.submission?.attachments?.length],
  );

  const submissionLocked = detail?.learningAccess?.submissionLocked === true;
  const isSpeakingExercise = isMediaSpeakingExercise(detail?.exerciseType);
  const showTeacherFeedbackCard =
    submissionLocked && (isSpeakingExercise || isWritingExercise);
  const showSpeakingFeedback = showTeacherFeedbackCard && isSpeakingExercise;

  const submitFiles = useCallback(
    async (files: File[]): Promise<boolean> => {
      if (!files.length || assignmentId == null) return false;

      const imageOnly = isExternalLinkExerciseType(detail?.exerciseType);
      if (!assertSubmissionFilesMimeAllowed(files, imageOnly)) return false;
      if (!assertSubmissionFilesSizeAllowed(files, imageOnly)) return false;

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
          mime.startsWith('audio/')
            ? 'audio'
            : mime.startsWith('video/')
              ? 'video'
              : mime.startsWith('image/')
                ? 'image'
                : 'audio',
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
      detail?.exerciseType,
    ],
  );

  const handleSubmitRecording = useCallback(
    (file: File) => submitFiles([file]),
    [submitFiles],
  );

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSubmitExternalLink = useCallback(async () => {
    if (assignmentId == null) return;
    const url = externalSubmissionUrl.trim();
    if (!url) {
      message.warning('Vui lòng nhập link bài làm / kết quả.');
      return;
    }
    const hasExisting = Boolean(
      detail?.submission?.submittedExternalUrl?.trim(),
    );
    if (hasExisting) {
      const ok = window.confirm(
        'Bạn đang nộp lại link. Link cũ sẽ được thay thế. Tiếp tục?',
      );
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(
        `/api/assignments/${assignmentId}/submission/link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            note: submissionNote.trim() || undefined,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.message === 'string' ? data.message : 'Nộp link thất bại.';
        message.error(msg);
        return;
      }
      message.success('Đã nộp link bài tập.');
      await loadDetail();
    } catch {
      message.error('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }, [
    assignmentId,
    detail?.submission?.submittedExternalUrl,
    externalSubmissionUrl,
    fetchWithAuth,
    loadDetail,
    submissionNote,
  ]);

  const handleDeleteSubmissionAttachment = useCallback(
    async (attachmentId: string) => {
      if (assignmentId == null) return;
      setDeletingAttachmentId(attachmentId);
      try {
        const res = await fetchWithAuth(
          `/api/assignments/${assignmentId}/submission/attachments/${encodeURIComponent(attachmentId)}`,
          { method: 'DELETE' },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data?.message === 'string'
              ? data.message
              : 'Không xóa được file.';
          message.error(msg);
          return;
        }
        message.success('Đã xóa file bài nộp.');
        await loadDetail();
      } catch {
        message.error('Lỗi mạng. Vui lòng thử lại.');
      } finally {
        setDeletingAttachmentId(null);
      }
    },
    [assignmentId, fetchWithAuth, loadDetail],
  );

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
      accept={getFileInputAccept(isExternalLinkExercise)}
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
            {readOnlyReason && !(isQuizWithLinkedForm && canStartQuiz) ? (
              <LearningAccessNotice
                message={readOnlyReason}
                variant="warning"
                title="Lớp chỉ xem"
              />
            ) : null}
          </Flex>
        ) : (
          'Chi tiết bài tập'
        )
      }
      open={open}
      onCancel={onClose}
      maskClosable={false}
      footer={
        <Button type="primary" onClick={onClose}>
          Đóng
        </Button>
      }
      width={720}
      destroyOnHidden
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
              {showTeacherFeedbackCard ? (
                <Text type="secondary">Xem mục «Kết quả chấm bài» bên dưới</Text>
              ) : (
                <Space size="small" wrap>
                  {detail.result?.scoreDisplay != null &&
                  detail.result.scoreDisplay !== '' ? (
                    <span>
                      Điểm: <strong>{detail.result.scoreDisplay}</strong>
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
              )}
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

          {deadlinePassed ? (
            <Alert
              type="warning"
              showIcon
              message="Đã quá hạn nộp bài tập"
              description="Bạn chỉ có thể xem nội dung và bài đã nộp trước đó."
            />
          ) : null}

          {isQuizWithLinkedForm && detail.testQuizFormPublicId ? (
            <Card size="small">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Làm bài trắc nghiệm</div>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    {quizCardDescription}
                  </Text>
                </div>
                <AssignmentQuizActionButtons
                  formPublicId={detail.testQuizFormPublicId}
                  assignmentId={detail.assignmentId}
                  allowStart={canStartQuiz}
                />
              </Flex>
            </Card>
          ) : null}

          {isVocabularyDrillExercise ? (
            <Card size="small">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Chơi game luyện từ</div>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    {vocabularyDrillCardDescription}
                  </Text>
                </div>
                {canStartVocabularyDrill && vocabularyDrillStartHref ? (
                  <Link href={vocabularyDrillStartHref} prefetch={false}>
                    <Button type="primary" icon={<ThunderboltOutlined />}>
                      Chơi game
                    </Button>
                  </Link>
                ) : (
                  <Button type="primary" icon={<ThunderboltOutlined />} disabled>
                    Chơi game
                  </Button>
                )}
              </Flex>
            </Card>
          ) : null}

          {isWritingExercise ? (
            <>
              <StudentWritingSubmissionPanel
                assignmentId={detail.assignmentId}
                open={open}
                canSubmit={canSubmit}
                disablePaste={detail.writingDisablePaste === true}
                writingMode={parseWritingExerciseMode(detail.writingMode)}
                dictationAudioAttachments={writingDictationAudios}
                resultStatus={detail.result?.resultStatus ?? null}
                submittedAt={detail.submission?.submittedAt}
                serverDraftText={detail.submission?.writingDraftText}
                submittedText={detail.submission?.submittedText}
                fetchWithAuth={fetchWithAuth}
                onSubmitted={loadDetail}
              />
              {showTeacherFeedbackCard ? (
                <StudentTeacherFeedbackCard detail={detail} />
              ) : null}
            </>
          ) : null}

          {isExternalLinkExercise && detail.externalLinkActivityUrl ? (
            <Card size="small">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Làm bài trên trang ngoài</div>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    {detail.studentUploadEnabled
                      ? 'Mở link làm bài, sau đó chụp ảnh kết quả và nộp bên dưới.'
                      : 'Mở link làm bài, sau đó nộp link kết quả ở mục bên dưới.'}
                  </Text>
                </div>
                <Button
                  type="primary"
                  href={detail.externalLinkActivityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở trang làm bài
                </Button>
              </Flex>
            </Card>
          ) : null}

          {canSubmit &&
          isExternalLinkExercise &&
          detail.studentUploadEnabled &&
          !isQuizWithLinkedForm ? (
            <Card size="small">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Nộp ảnh kết quả</div>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    Chỉ ảnh (jpg, png, …), tối đa {maxUploadFiles} ảnh/lần, mỗi
                    ảnh dưới 2MB.
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
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={handlePickFile}
                >
                  Chọn ảnh
                </Button>
              </Flex>
            </Card>
          ) : null}

          {canSubmit &&
          isExternalLinkExercise &&
          !detail.studentUploadEnabled &&
          !isQuizWithLinkedForm ? (
            <Card size="small">
              <Flex vertical gap="middle">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: token.marginXS }}>
                    Nộp link kết quả
                  </div>
                  <Input
                    value={externalSubmissionUrl}
                    onChange={(e) => setExternalSubmissionUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={submitting}
                  />
                </div>
                <Input.TextArea
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Ghi chú (tuỳ chọn)"
                  disabled={submitting}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={() => void handleSubmitExternalLink()}
                >
                  {detail.submission?.submittedExternalUrl
                    ? 'Cập nhật link'
                    : 'Nộp link'}
                </Button>
              </Flex>
            </Card>
          ) : null}

          {canSubmit &&
          detail.studentUploadEnabled &&
          !isQuizWithLinkedForm &&
          !isExternalLinkExercise &&
          !isWritingExercise ? (
            <Card size="small">
              <Flex justify="space-between" align="center" gap="middle" wrap>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Nộp bài trực tiếp</div>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    Tối đa {maxUploadFiles} file mỗi lần, mỗi file tối đa 50MB
                    (chỉ âm thanh, ảnh, video). Có thể xóa từng file bài nộp bên
                    dưới; nộp file mới khi còn chỗ hoặc sau khi xóa.
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

          {showSpeakingFeedback ? (
            <StudentTeacherFeedbackCard
              detail={detail}
              showMediaTimelineHint
            />
          ) : null}

          {!showTeacherFeedbackCard && submissionLocked ? (
            <Card size="small" title="Nhận xét của giáo viên">
              {detail.result?.teacherNote ? (
                <Text style={{ display: 'block', marginBottom: token.marginSM }}>
                  {detail.result.teacherNote}
                </Text>
              ) : null}
              {detail.result?.assessmentTags?.length ? (
                <Space wrap size={[4, 4]}>
                  {detail.result.assessmentTags.map((t) => (
                    <Tag key={t.id} color={t.color}>
                      {t.name}
                    </Tag>
                  ))}
                </Space>
              ) : null}
            </Card>
          ) : null}

          {isExternalLinkExercise &&
          detail.submission?.submittedExternalUrl?.trim() ? (
            <div>
              <Title
                level={5}
                style={{
                  marginTop: token.marginSM,
                  marginBottom: token.marginXS,
                }}
              >
                Link đã nộp
              </Title>
              {detail.submission.submittedAt ? (
                <Text type="secondary" style={{ fontSize: token.fontSize }}>
                  Nộp lúc:{' '}
                  {new Date(detail.submission.submittedAt).toLocaleString(
                    'vi-VN',
                  )}
                </Text>
              ) : null}
              <div style={{ marginTop: token.marginXS }}>
                <a
                  href={detail.submission.submittedExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {detail.submission.submittedExternalUrl}
                </a>
              </div>
              {detail.submission.submittedNote ? (
                <Text
                  type="secondary"
                  style={{ fontSize: token.fontSize, display: 'block' }}
                >
                  Ghi chú: {detail.submission.submittedNote}
                </Text>
              ) : null}
            </div>
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
                {showSpeakingFeedback ? (
                  <StudentSubmissionReviewList
                    attachments={detail.submission.attachments}
                    submissionLocked={submissionLocked}
                    onOpenTimeline={openTimelineReview}
                    onOpenPlainPlay={openPlainPlay}
                  />
                ) : (
                  detail.submission.attachments.map((a) => (
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
                          {canSubmit && detail.studentUploadEnabled ? (
                            <Popconfirm
                              title="Xóa file bài nộp?"
                              description="Sau khi xóa, bạn có thể chọn hoặc ghi âm file mới."
                              okText="Xóa"
                              cancelText="Huỷ"
                              okButtonProps={{ danger: true }}
                              onConfirm={() =>
                                void handleDeleteSubmissionAttachment(a.id)
                              }
                            >
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                loading={deletingAttachmentId === a.id}
                                disabled={
                                  submitting ||
                                  (deletingAttachmentId != null &&
                                    deletingAttachmentId !== a.id)
                                }
                              >
                                Xóa
                              </Button>
                            </Popconfirm>
                          ) : null}
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
                              onClick={() => openPlainPlay(a, a.name)}
                            >
                              Phát
                            </Button>
                          ) : (
                            <StudentOpenInNewTabLink
                              href={a.url}
                              icon={<ExportOutlined />}
                            >
                              Mở
                            </StudentOpenInNewTabLink>
                          )}
                        </Space>
                      </Flex>
                    </Card>
                  ))
                )}
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
                            <StudentOpenInNewTabLink
                              href={url}
                              icon={<ExportOutlined />}
                            >
                              {assignmentAttachmentOpenTabLabel(item)}
                            </StudentOpenInNewTabLink>
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
    {mediaReviewAtt ? (
      <StudentSubmissionMediaReviewModal
        open={mediaReviewOpen}
        title={`Nhận xét — ${mediaReviewAtt.label}`}
        url={mediaReviewAtt.url}
        mimeType={mediaReviewAtt.mimeType}
        resourceKind={mediaReviewAtt.resourceKind}
        comments={mediaReviewAtt.mediaReviewComments ?? []}
        durationMs={mediaReviewAtt.durationMs}
        onClose={() => {
          setMediaReviewOpen(false);
          setMediaReviewAtt(null);
        }}
      />
    ) : null}
    </>
  );
}

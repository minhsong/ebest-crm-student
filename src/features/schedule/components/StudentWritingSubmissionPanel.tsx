'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Card, Flex, Input, message, Popconfirm, Typography, theme } from 'antd';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import {
  getWritingEditorHint,
  isWritingDictationMode,
  isWritingHtmlEmpty,
  looksLikeWritingHtml,
  normalizeWritingSubmissionText,
  parseWritingExerciseMode,
  WRITING_EXERCISE_MODES,
  WRITING_SUBMISSION_MAX_CHARS,
  countWritingWords,
  writingPlainTextForLimits,
} from '@/lib/writing-assignment';
import { useWritingSubmissionDraft } from '@/features/schedule/hooks/useWritingSubmissionDraft';
import { StudentWritingDictationAudioPanel } from '@/features/schedule/components/StudentWritingDictationAudioPanel';
import { BasicRichTextEditor } from '@/components/rich-text/BasicRichTextEditor';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { StudentAssignmentAttachment } from '@/types/student-assignment-detail';
import type { WritingExerciseMode } from '@/lib/writing-assignment';

const { Text } = Typography;

type StudentWritingSubmissionPanelProps = {
  assignmentId: number;
  canSubmit: boolean;
  disablePaste: boolean;
  writingMode?: WritingExerciseMode;
  dictationAudioAttachments?: StudentAssignmentAttachment[];
  resultStatus: number | null;
  submittedAt?: string | null;
  serverDraftText?: string | null;
  submittedText?: string | null;
  open: boolean;
  fetchWithAuth: (url: string, init?: RequestInit) => Promise<Response>;
  onSubmitted: () => Promise<void>;
};

export function StudentWritingSubmissionPanel({
  assignmentId,
  canSubmit,
  disablePaste,
  writingMode = WRITING_EXERCISE_MODES.free,
  dictationAudioAttachments = [],
  resultStatus,
  submittedAt,
  serverDraftText,
  submittedText,
  open,
  fetchWithAuth,
  onSubmitted,
}: StudentWritingSubmissionPanelProps) {
  const { token } = theme.useToken();
  const [submitting, setSubmitting] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');

  const isSubmitted =
    resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED ||
    resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED;
  const canEdit = canSubmit && resultStatus !== CRM_ASSIGNMENT_RESULT_STATUS.GRADED;

  const {
    text,
    onTextChange,
    draftStatus,
    lastSavedAt,
    clearDraftAfterSubmit,
  } = useWritingSubmissionDraft({
    assignmentId,
    open,
    canEdit,
    serverDraftText,
    submittedText,
    isSubmitted,
    fetchWithAuth,
  });

  const plainLen = useMemo(() => writingPlainTextForLimits(text).length, [text]);
  const wordCount = useMemo(() => countWritingWords(text), [text]);
  const isEmpty = useMemo(() => isWritingHtmlEmpty(text), [text]);

  const resolvedMode = parseWritingExerciseMode(writingMode);
  const editorHint = useMemo(
    () => getWritingEditorHint(resolvedMode, disablePaste),
    [resolvedMode, disablePaste],
  );

  const handleSubmit = useCallback(async () => {
    const normalized = normalizeWritingSubmissionText(text);
    if (isWritingHtmlEmpty(normalized)) {
      message.warning('Vui lòng nhập nội dung bài viết trước khi nộp.');
      return;
    }
    if (normalized.length > WRITING_SUBMISSION_MAX_CHARS) {
      message.error(
        `Nội dung vượt quá ${WRITING_SUBMISSION_MAX_CHARS.toLocaleString('vi-VN')} ký tự.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(
        `/api/assignments/${assignmentId}/submission/writing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: normalized,
            note: submissionNote.trim() || undefined,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.message === 'string'
            ? data.message
            : 'Nộp bài viết thất bại.';
        message.error(msg);
        return;
      }
      clearDraftAfterSubmit();
      message.success('Đã nộp bài viết.');
      await onSubmitted();
    } catch {
      message.error('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }, [
    assignmentId,
    clearDraftAfterSubmit,
    fetchWithAuth,
    onSubmitted,
    submissionNote,
    text,
  ]);

  if (!canSubmit && !isSubmitted) {
    return null;
  }

  return (
    <Card size="small">
      <Flex vertical gap="middle">
        <div>
          <div style={{ fontWeight: 600, marginBottom: token.marginXS }}>
            {canEdit ? 'Viết bài' : 'Bài viết đã nộp'}
          </div>
          {canEdit ? (
            <Text type="secondary" style={{ fontSize: token.fontSize }}>
              {editorHint}
            </Text>
          ) : submittedAt ? (
            <Text type="secondary" style={{ fontSize: token.fontSize }}>
              Nộp lúc: {new Date(submittedAt).toLocaleString('vi-VN')}
            </Text>
          ) : null}
        </div>

        {isWritingDictationMode(resolvedMode) ? (
          <div>
            <div style={{ fontWeight: 600, marginBottom: token.marginXS }}>
              Nghe và chép
            </div>
            <StudentWritingDictationAudioPanel items={dictationAudioAttachments} />
          </div>
        ) : null}

        {canEdit ? (
          <BasicRichTextEditor
            value={text}
            onChange={onTextChange}
            disablePaste={disablePaste}
            disabled={submitting}
            minHeight={260}
            placeholder="Nhập bài viết của bạn…"
          />
        ) : (
          <div
            style={{
              padding: token.paddingMD,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorFillAlter,
              maxHeight: 420,
              overflow: 'auto',
            }}
          >
            {looksLikeWritingHtml(text) ? (
              <QaArticleHtml html={text} />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                {text || '—'}
              </div>
            )}
          </div>
        )}

        <Flex justify="space-between" align="center" wrap gap={8}>
          <Text type="secondary" style={{ fontSize: token.fontSize }}>
            {wordCount} từ · {plainLen.toLocaleString('vi-VN')} ký tự (nội dung)
            {canEdit && draftStatus === 'saving' ? ' · Đang lưu nháp…' : ''}
            {canEdit && draftStatus === 'saved' && lastSavedAt
              ? ` · Đã lưu nháp ${new Date(lastSavedAt).toLocaleTimeString('vi-VN')}`
              : ''}
            {canEdit && draftStatus === 'error'
              ? ' · Không lưu được nháp (vẫn giữ trên máy)'
              : ''}
          </Text>
        </Flex>

        {canEdit ? (
          <>
            <Input.TextArea
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ghi chú kèm bài nộp (tuỳ chọn)"
              disabled={submitting}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Flex justify="flex-end">
              <Popconfirm
                title="Nộp bài viết?"
                description={
                  isSubmitted
                    ? 'Bài nộp hiện tại sẽ được thay thế.'
                    : 'Sau khi nộp, giáo viên sẽ chấm bài.'
                }
                okText="Nộp bài"
                cancelText="Huỷ"
                onConfirm={() => void handleSubmit()}
                disabled={submitting || isEmpty}
              >
                <Button type="primary" loading={submitting} disabled={isEmpty}>
                  {isSubmitted ? 'Cập nhật bài viết' : 'Nộp bài'}
                </Button>
              </Popconfirm>
            </Flex>
          </>
        ) : null}
      </Flex>
    </Card>
  );
}

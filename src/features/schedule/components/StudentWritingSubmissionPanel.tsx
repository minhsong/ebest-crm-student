'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Card, Flex, Input, message, Popconfirm, Typography, theme } from 'antd';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import {
  countWritingWords,
  WRITING_SUBMISSION_MAX_CHARS,
} from '@/lib/writing-assignment';
import { useWritingSubmissionDraft } from '@/features/schedule/hooks/useWritingSubmissionDraft';

const { Text } = Typography;

type StudentWritingSubmissionPanelProps = {
  assignmentId: number;
  canSubmit: boolean;
  disablePaste: boolean;
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

  const wordCount = useMemo(() => countWritingWords(text), [text]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (disablePaste && canEdit) {
        e.preventDefault();
        message.warning('Bài tập này không cho phép dán từ clipboard — vui lòng tự gõ.');
      }
    },
    [canEdit, disablePaste],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      message.warning('Vui lòng nhập nội dung bài viết trước khi nộp.');
      return;
    }
    if (trimmed.length > WRITING_SUBMISSION_MAX_CHARS) {
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
            text: trimmed,
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
              Nhập nội dung dạng văn bản thuần (có xuống dòng). Nội dung được lưu
              nháp tự động; bấm Nộp bài khi hoàn thành.
              {disablePaste ? ' Không được dán từ clipboard.' : ''}
            </Text>
          ) : submittedAt ? (
            <Text type="secondary" style={{ fontSize: token.fontSize }}>
              Nộp lúc: {new Date(submittedAt).toLocaleString('vi-VN')}
            </Text>
          ) : null}
        </div>

        <Input.TextArea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={handlePaste}
          rows={10}
          maxLength={WRITING_SUBMISSION_MAX_CHARS}
          placeholder="Nhập bài viết của bạn…"
          disabled={!canEdit || submitting}
          style={{ fontFamily: 'inherit' }}
          autoSize={{ minRows: 10, maxRows: 20 }}
        />

        <Flex justify="space-between" align="center" wrap gap={8}>
          <Text type="secondary" style={{ fontSize: token.fontSize }}>
            {wordCount} từ · {text.length.toLocaleString('vi-VN')}/
            {WRITING_SUBMISSION_MAX_CHARS.toLocaleString('vi-VN')} ký tự
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
                disabled={submitting || !text.trim()}
              >
                <Button type="primary" loading={submitting} disabled={!text.trim()}>
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

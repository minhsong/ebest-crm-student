'use client';

import {
  LISTENING_NAV_LOCKED_TOOLTIP,
  LISTENING_SUBMIT_LOCKED_TOOLTIP,
} from '@/features/quiz-test/lib/quiz-section-listening-locks';
import type { QuizFormSectionPayload } from '@/features/quiz-test/types';
import { App, Button, Divider, Space, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';

export type QuizAttemptTakingFooterProps = {
  submitting: boolean;
  onSubmit: () => void | Promise<void>;
  sections?: QuizFormSectionPayload[];
  activeSectionId?: number | null;
  onGoPrevSection?: () => void;
  onGoNextSection?: () => void;
  /** Khóa chuyển phần khi chưa xong lượt nghe của phần hiện tại. */
  listeningNavLocked?: boolean;
  /** Khóa nộp bài khi chưa nghe xong ít nhất một vòng audio (nếu có). */
  listeningSubmitLocked?: boolean;
};

/** Chân trang làm bài: section không cuối → Trước/Tiếp; section cuối → Trước (nếu có) + Nộp bài; một phần → chỉ Nộp bài. */
export function QuizAttemptTakingFooter({
  submitting,
  onSubmit,
  sections,
  activeSectionId,
  onGoPrevSection,
  onGoNextSection,
  listeningNavLocked,
  listeningSubmitLocked = false,
}: QuizAttemptTakingFooterProps) {
  const { modal } = App.useApp();

  const sorted = useMemo(
    () => [...(sections ?? [])].sort((a, b) => a.order - b.order),
    [sections],
  );

  const idx =
    sorted.length && typeof activeSectionId === 'number'
      ? sorted.findIndex((s) => s.sectionId === activeSectionId)
      : -1;
  const multiSection = sorted.length > 1 && idx >= 0;
  const isFirst = idx <= 0;
  const isLast = idx >= 0 && idx === sorted.length - 1;

  const requestSubmit = () => {
    modal.confirm({
      title: 'Xác nhận nộp bài?',
      content:
        'Sau khi nộp bài, bạn sẽ không thể tiếp tục làm bài hay thay đổi câu trả lời. Bạn có chắc chắn muốn nộp bài lúc này?',
      okText: 'Nộp bài',
      cancelText: 'Làm tiếp',
      okButtonProps: { type: 'primary' },
      onOk: () => onSubmit(),
    });
  };

  return (
    <>
      <Divider className="!my-0" />
      <div className="flex flex-col gap-2 px-4 pb-6 pt-3 md:px-6">
        {multiSection && idx >= 0 ? (
          <Typography.Text type="secondary" className="text-sm">
            Phần {idx + 1}/{sorted.length}
            {sorted[idx]?.title?.trim() ? ` — ${sorted[idx].title.trim()}` : null}
            {listeningNavLocked ? ' — Hoàn thành phần nghe để chuyển phần.' : null}
          </Typography.Text>
        ) : null}
        <Space wrap size="middle">
          {multiSection ? (
            <>
              <Tooltip
                title={listeningNavLocked ? LISTENING_NAV_LOCKED_TOOLTIP : undefined}
              >
                <span>
                  <Button
                    size="large"
                    disabled={isFirst || listeningNavLocked}
                    onClick={() => onGoPrevSection?.()}
                  >
                    Phần trước
                  </Button>
                </span>
              </Tooltip>
              {isLast ? (
                <Tooltip
                  title={
                    listeningSubmitLocked ? LISTENING_SUBMIT_LOCKED_TOOLTIP : undefined
                  }
                >
                  <span>
                    <Button
                      type="primary"
                      size="large"
                      loading={submitting}
                      disabled={listeningSubmitLocked}
                      onClick={requestSubmit}
                    >
                      Nộp bài
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip
                  title={listeningNavLocked ? LISTENING_NAV_LOCKED_TOOLTIP : undefined}
                >
                  <span>
                    <Button
                      type="primary"
                      size="large"
                      disabled={listeningNavLocked}
                      onClick={() => onGoNextSection?.()}
                    >
                      Phần tiếp theo
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          ) : (
            <Tooltip
              title={
                listeningSubmitLocked ? LISTENING_SUBMIT_LOCKED_TOOLTIP : undefined
              }
            >
              <span>
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  disabled={listeningSubmitLocked}
                  onClick={requestSubmit}
                >
                  Nộp bài
                </Button>
              </span>
            </Tooltip>
          )}
        </Space>
      </div>
    </>
  );
}

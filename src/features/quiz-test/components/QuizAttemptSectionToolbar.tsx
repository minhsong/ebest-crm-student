'use client';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import type { QuizFormSectionPayload } from '@/features/quiz-test/types';
import { Button, Typography } from 'antd';
import { useMemo } from 'react';

export type QuizAttemptSectionToolbarProps = {
  /** Có nhiều hơn một section và đang có `activeSectionId` hợp lệ. */
  multiSection: boolean;
  showOutline: boolean;
  outlineOpen: boolean;
  sections?: QuizFormSectionPayload[];
  activeSectionId: number | null;
  onToggleOutline: () => void;
};

/**
 * Mục lục (toggle) + nhãn phần hiện tại. Đổi section bằng nút chân trang Phần trước/tiếp.
 */
export function QuizAttemptSectionToolbar({
  multiSection,
  showOutline,
  outlineOpen,
  sections,
  activeSectionId,
  onToggleOutline,
}: QuizAttemptSectionToolbarProps) {
  const sectionLabel = useMemo(() => {
    if (!multiSection || !sections?.length || typeof activeSectionId !== 'number') return null;
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.sectionId === activeSectionId);
    if (idx < 0) return null;
    const s = sorted[idx];
    const title = s.title?.trim() || `Phần ${idx + 1}`;
    return sorted.length > 1 ? `Phần ${idx + 1}/${sorted.length}: ${title}` : title;
  }, [activeSectionId, multiSection, sections]);

  if (!multiSection && !showOutline) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 pb-2 md:px-6">
      {showOutline ? (
        <Button
          size="small"
          type={outlineOpen ? 'primary' : 'default'}
          icon={outlineOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={onToggleOutline}
        >
          {outlineOpen ? 'Đóng mục lục' : 'Mục lục câu'}
        </Button>
      ) : null}
      {sectionLabel ? (
        <Typography.Text type="secondary" className="text-sm">
          {sectionLabel}
        </Typography.Text>
      ) : null}
    </div>
  );
}

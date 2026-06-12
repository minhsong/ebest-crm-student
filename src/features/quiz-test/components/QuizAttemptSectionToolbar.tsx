'use client';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export type QuizAttemptSectionToolbarProps = {
  showOutline: boolean;
  outlineOpen: boolean;
  onToggleOutline: () => void;
};

/**
 * Mục lục (toggle). Nhãn phần nằm trong Alert hướng dẫn — không lặp ở đây.
 */
export function QuizAttemptSectionToolbar({
  showOutline,
  outlineOpen,
  onToggleOutline,
}: QuizAttemptSectionToolbarProps) {
  if (!showOutline) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 pb-2 md:px-6">
      <Button
        size="small"
        type={outlineOpen ? 'primary' : 'default'}
        icon={outlineOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        onClick={onToggleOutline}
      >
        {outlineOpen ? 'Đóng mục lục' : 'Mục lục câu'}
      </Button>
    </div>
  );
}

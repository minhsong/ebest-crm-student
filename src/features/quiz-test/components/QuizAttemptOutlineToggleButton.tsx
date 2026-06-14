'use client';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export type QuizAttemptOutlineToggleVariant = 'below' | 'inline';

export type QuizAttemptOutlineToggleButtonProps = {
  outlineOpen: boolean;
  onToggleOutline: () => void;
  /** `below` — dưới card thông tin; `inline` — cạnh Số câu khi sticky. */
  variant?: QuizAttemptOutlineToggleVariant;
};

export function QuizAttemptOutlineToggleButton({
  outlineOpen,
  onToggleOutline,
  variant = 'below',
}: QuizAttemptOutlineToggleButtonProps) {
  const icon = outlineOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />;

  if (variant === 'inline') {
    return (
      <Button
        type={outlineOpen ? 'primary' : 'default'}
        size="small"
        className="quiz-attempt-outline-toggle quiz-attempt-outline-toggle--inline"
        icon={icon}
        onClick={onToggleOutline}
      >
        Mục lục
      </Button>
    );
  }

  return (
    <Button
      type={outlineOpen ? 'primary' : 'default'}
      size="small"
      className="quiz-attempt-outline-toggle quiz-attempt-outline-toggle--below"
      icon={icon}
      onClick={onToggleOutline}
    >
      {outlineOpen ? 'Đóng mục lục' : 'Mục lục câu'}
    </Button>
  );
}

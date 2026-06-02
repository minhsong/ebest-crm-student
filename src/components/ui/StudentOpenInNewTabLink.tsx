'use client';

import type { ReactNode } from 'react';
import type { ButtonProps } from 'antd';
import { Button } from 'antd';

type Props = {
  href: string;
  children: ReactNode;
  icon?: ButtonProps['icon'];
  size?: ButtonProps['size'];
  type?: ButtonProps['type'];
  className?: string;
  style?: ButtonProps['style'];
};

/**
 * Mở tab mới bằng thẻ `<a>` (Ant Design Button + href).
 * Tránh onClick + window.open sau async (bị chặn popup).
 */
export function StudentOpenInNewTabLink({
  href,
  children,
  icon,
  size = 'small',
  type = 'default',
  className,
  style,
}: Props) {
  const url = href.trim();
  if (!url) return null;

  return (
    <Button
      size={size}
      type={type}
      icon={icon}
      className={className}
      style={style}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </Button>
  );
}

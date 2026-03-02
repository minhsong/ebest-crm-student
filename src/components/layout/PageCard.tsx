import React from 'react';
import { Card } from 'antd';

interface PageCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
}

/**
 * Card wrapper cho nội dung trang – Ant Design token, đồng bộ với layout.
 */
export function PageCard({
  children,
  title,
  className = '',
  noPadding,
}: PageCardProps) {
  return (
    <Card
      title={title}
      className={className}
      styles={{
        ...(noPadding ? { body: { padding: 0 } } : {}),
      }}
      style={{ marginBottom: 24 }}
    >
      {children}
    </Card>
  );
}

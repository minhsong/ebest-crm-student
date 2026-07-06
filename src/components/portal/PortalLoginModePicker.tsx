'use client';

import { Segmented } from 'antd';

export type PortalLoginMode = 'customer' | 'lead';

export const PORTAL_LOGIN_MODE_OPTIONS: {
  label: string;
  value: PortalLoginMode;
}[] = [
  { label: 'Đang là học viên Ebest', value: 'customer' },
  { label: 'Chưa học tại Ebest', value: 'lead' },
];

type Props = {
  value: PortalLoginMode;
  onChange: (mode: PortalLoginMode) => void;
  /** Login page — nền cam; forgot-password — nền sáng */
  variant?: 'brand' | 'default';
  className?: string;
};

/** Segmented chọn vai trò — LP-D1, dùng chung login / forgot-password. */
export function PortalLoginModePicker({
  value,
  onChange,
  variant = 'default',
  className,
}: Props) {
  const brandClass =
    variant === 'brand'
      ? [
          '!bg-white/15',
          '[&_.ant-segmented-item:not(.ant-segmented-item-selected)_.ant-segmented-item-label]:!text-white',
          '[&_.ant-segmented-item-selected]:!bg-white',
          '[&_.ant-segmented-item-selected]:!shadow-sm',
          '[&_.ant-segmented-item-selected_.ant-segmented-item-label]:!text-[#e35321]',
          '[&_.ant-segmented-item-selected_.ant-segmented-item-label]:!font-semibold',
        ].join(' ')
      : '';

  return (
    <Segmented
      block
      className={`${brandClass} ${className ?? ''}`.trim()}
      value={value}
      onChange={(v) => onChange(v as PortalLoginMode)}
      options={PORTAL_LOGIN_MODE_OPTIONS}
    />
  );
}

export function parsePortalLoginModeFromQuery(
  raw: string | null | undefined,
): PortalLoginMode {
  return raw === 'lead' ? 'lead' : 'customer';
}

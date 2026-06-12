'use client';

import type { ReactNode } from 'react';
import { Popover, Typography } from 'antd';
import { InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './learning-access-notice.css';

export type LearningAccessNoticeVariant = 'info' | 'warning';

type NoticeProps = {
	message: string;
	variant?: LearningAccessNoticeVariant;
	title?: string;
	className?: string;
	placement?: 'top' | 'bottom' | 'bottomLeft' | 'left';
};

/** Icon info/cảnh báo — hover hoặc chạm để xem ghi chú nghiệp vụ (không chiếm banner). */
export function LearningAccessNotice({
	message,
	variant = 'info',
	title = 'Lưu ý',
	className,
	placement = 'bottomLeft',
}: NoticeProps) {
	const trimmed = message.trim();
	if (!trimmed) {
		return null;
	}

	const Icon =
		variant === 'warning' ? ExclamationCircleOutlined : InfoCircleOutlined;

	return (
		<Popover
			trigger={['hover', 'click']}
			placement={placement}
			overlayClassName="learning-access-notice-popover"
			content={
				<div className="learning-access-notice-popover__body">
					<Typography.Text strong className="learning-access-notice-popover__title">
						{title}
					</Typography.Text>
					<Typography.Paragraph className="learning-access-notice-popover__message">
						{trimmed}
					</Typography.Paragraph>
				</div>
			}
		>
			<button
				type="button"
				className={[
					'learning-access-notice-trigger',
					`learning-access-notice-trigger--${variant}`,
					className,
				]
					.filter(Boolean)
					.join(' ')}
				aria-label={`${title}: ${trimmed}`}
			>
				<Icon aria-hidden />
			</button>
		</Popover>
	);
}

type InlineProps = {
	message?: string | null;
	variant?: LearningAccessNoticeVariant;
	title?: string;
	children: ReactNode;
	className?: string;
};

/** Gắn icon cạnh tiêu đề / nhãn — dùng **một lần** ở cấp trang, tránh lặp Alert. */
export function LearningAccessNoticeInline({
	message,
	variant = 'info',
	title,
	children,
	className,
}: InlineProps) {
	const trimmed = message?.trim();
	if (!trimmed) {
		return <>{children}</>;
	}

	return (
		<span
			className={['learning-access-notice-inline', className].filter(Boolean).join(' ')}
		>
			{children}
			<LearningAccessNotice message={trimmed} variant={variant} title={title} />
		</span>
	);
}

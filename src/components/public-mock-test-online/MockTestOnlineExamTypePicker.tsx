'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Collapse, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import type { MockTestOnlineCampaign } from '@/lib/public-mock-test-online/types';
import {
	formatMockTestRegistrationDeadline,
	groupCampaignsByTestType,
} from '@/lib/public-mock-test-online/exam-flow.util';

const { Text } = Typography;

function formatDuration(minutes: number | null | undefined): string | null {
	if (!minutes || minutes < 1) return null;
	return `~${minutes} phút`;
}

export type MockTestOnlineExamTypePickerProps = {
	campaigns: MockTestOnlineCampaign[];
	/** Form.Item injects `value` — alias selectedSessionId. */
	value?: number | null;
	selectedSessionId?: number | null;
	/** Form.Item injects `onChange`. */
	onChange?: (sessionId: number) => void;
	onSelect?: (sessionId: number) => void;
	/** Prefix cho aria / test id — mặc định select-exam. */
	idPrefix?: string;
};

/**
 * Chọn bài thi theo loại — Collapse (expand panel đầu mặc định) + card bài thi.
 * Short description (`marketingBlurb`) hiện khi card được chọn.
 * Tương thích Ant Design Form.Item (`value` / `onChange`).
 */
export function MockTestOnlineExamTypePicker({
	campaigns,
	value,
	selectedSessionId,
	onChange,
	onSelect,
	idPrefix = 'mto-exam-type',
}: MockTestOnlineExamTypePickerProps) {
	const selected =
		value ?? selectedSessionId ?? null;

	const handleSelect = (sessionId: number) => {
		onChange?.(sessionId);
		onSelect?.(sessionId);
	};

	const grouped = useMemo(
		() => groupCampaignsByTestType(campaigns),
		[campaigns],
	);

	const firstKey = grouped[0]?.testTypeCode ?? '';
	const [activeKeys, setActiveKeys] = useState<string[]>(
		firstKey ? [firstKey] : [],
	);

	useEffect(() => {
		if (!firstKey) {
			setActiveKeys([]);
			return;
		}
		const valid = new Set(grouped.map((g) => g.testTypeCode));
		setActiveKeys((prev) => {
			const kept = prev.filter((k) => valid.has(k));
			return kept.length > 0 ? kept : [firstKey];
		});
	}, [firstKey, grouped]);

	/** Khi chọn bài thuộc panel đang đóng — mở panel đó để thấy selection. */
	useEffect(() => {
		if (selected == null) return;
		const group = grouped.find((g) =>
			g.items.some((c) => c.sessionId === selected),
		);
		if (!group) return;
		setActiveKeys((prev) =>
			prev.includes(group.testTypeCode)
				? prev
				: [...prev, group.testTypeCode],
		);
	}, [selected, grouped]);

	if (campaigns.length === 0) return null;

	return (
		<Collapse
			accordion={false}
			activeKey={activeKeys}
			onChange={(keys) => {
				const next = Array.isArray(keys) ? keys.map(String) : [String(keys)];
				setActiveKeys(next);
			}}
			className="mto-exam-type-collapse"
			items={grouped.map((group) => ({
				key: group.testTypeCode,
				label: (
					<span className="mto-exam-type-collapse-label">{group.label}</span>
				),
				children: (
					<Space
						direction="vertical"
						className="w-full"
						size="small"
						id={`${idPrefix}-${group.testTypeCode}`}
					>
						{group.items.map((c) => {
							const isSelected = selected === c.sessionId;
							const duration = formatDuration(c.estimatedDurationMinutes);
							const deadline = formatMockTestRegistrationDeadline(
								c.registrationDeadlineAt,
							);
							const blurb = c.marketingBlurb?.trim() || null;

							return (
								<Card
									key={c.sessionId}
									size="small"
									role="button"
									tabIndex={0}
									aria-pressed={isSelected}
									className={`mock-test-campaign-card mto-exam-pick-card${
										isSelected ? ' mock-test-campaign-card--selected' : ''
									}`}
									onClick={() => handleSelect(c.sessionId)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleSelect(c.sessionId);
										}
									}}
								>
									<div className="mock-test-campaign-card-head">
										<Text strong className="mock-test-campaign-card-title">
											{c.title}
										</Text>
									</div>
									<div className="mock-test-campaign-card-meta">
										{duration ? (
											<Text type="secondary" className="text-xs">
												<ClockCircleOutlined className="mr-1" />
												Thời lượng {duration}
											</Text>
										) : null}
										{deadline ? (
											<Text type="secondary" className="text-xs">
												<FileTextOutlined className="mr-1" />
												Hạn đăng ký: {deadline}
											</Text>
										) : null}
										{c.variantMode === 'user_choice' ? (
											<Tag className="!m-0 !mt-1 w-fit">Chọn Full hoặc Mini</Tag>
										) : null}
									</div>
									{isSelected && blurb ? (
										<Text
											type="secondary"
											className="mto-exam-pick-card-blurb"
										>
											{blurb}
										</Text>
									) : null}
								</Card>
							);
						})}
					</Space>
				),
			}))}
		/>
	);
}

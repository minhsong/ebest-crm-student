'use client';

import { Card, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import type { MockTestOnlineCampaign } from '@/lib/public-mock-test-online/types';
import { formatMockTestRegistrationDeadline, formatQuestionCountLabel } from '@/lib/public-mock-test-online/exam-flow.util';
import { formatDurationMinutes } from '@/lib/public-mock-test-online/select-exam-type-rows.util';

const { Text } = Typography;

type Props = {
	campaigns: MockTestOnlineCampaign[];
	selectedSessionId: number | null;
	onSelect: (sessionId: number) => void;
	idPrefix?: string;
};

/** Danh sách campaign cards — chọn sessionId (Form.Item value). */
export function MockTestOnlineCampaignPickList({
	campaigns,
	selectedSessionId,
	onSelect,
	idPrefix = 'mto-campaign-pick',
}: Props) {
	if (!campaigns.length) {
		return (
			<Text type="secondary">Không có đợt thi đang mở cho loại này.</Text>
		);
	}

	return (
		<Space direction="vertical" className="w-full" size="small" id={idPrefix}>
			{campaigns.map((c) => {
				const isSelected = selectedSessionId === c.sessionId;
				const duration = formatDurationMinutes(c.estimatedDurationMinutes);
				const deadline = formatMockTestRegistrationDeadline(
					c.registrationDeadlineAt,
				);
				const blurb = c.marketingBlurb?.trim() || null;
				const qCount = formatQuestionCountLabel(c.questionCount);

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
						onClick={() => onSelect(c.sessionId)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onSelect(c.sessionId);
							}
						}}
					>
						<div className="mock-test-campaign-card-head">
							<Text strong className="mock-test-campaign-card-title">
								{c.title}
							</Text>
						</div>
						<div className="mock-test-campaign-card-meta">
							{qCount ? (
								<Text type="secondary" className="text-xs">
									{qCount}
								</Text>
							) : null}
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
							<Text type="secondary" className="mto-exam-pick-card-blurb">
								{blurb}
							</Text>
						) : null}
					</Card>
				);
			})}
		</Space>
	);
}

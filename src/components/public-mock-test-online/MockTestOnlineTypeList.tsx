'use client';

import { Card, Space, Tag, Typography } from 'antd';
import type { MockTestSelectExamTypeRow } from '@/lib/public-mock-test-online/select-exam-type-rows.util';
import {
	formatDurationMinutes,
	formatQuestionCountMeta,
} from '@/lib/public-mock-test-online/select-exam-type-rows.util';

const { Text } = Typography;

type Props = {
	rows: MockTestSelectExamTypeRow[];
	selectedCode: string | null;
	onSelect: (code: string) => void;
	idPrefix?: string;
};

export function MockTestOnlineTypeList({
	rows,
	selectedCode,
	onSelect,
	idPrefix = 'mto-type-list',
}: Props) {
	return (
		<Space
			direction="vertical"
			className="w-full mto-type-list"
			size="small"
			id={idPrefix}
		>
			{rows.map((row) => {
				const selected = row.testTypeCode === selectedCode;
				const qMeta = formatQuestionCountMeta(
					row.questionCountMin,
					row.questionCountMax,
					{
						miniMin: row.questionCountMiniMin,
						miniMax: row.questionCountMiniMax,
					},
				);
				const duration = formatDurationMinutes(row.durationMinutes);
				return (
					<Card
						key={row.testTypeCode}
						size="small"
						role="button"
						tabIndex={0}
						aria-pressed={selected}
						className={`mto-type-list-card${
							selected ? ' mto-type-list-card--selected' : ''
						}`}
						onClick={() => onSelect(row.testTypeCode)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onSelect(row.testTypeCode);
							}
						}}
					>
						<Text strong className="mto-type-list-card-title">
							{row.displayNameVi}
						</Text>
						<div className="mto-type-list-card-meta">
							{qMeta ? (
								<Text type="secondary" className="text-xs">
									{qMeta}
								</Text>
							) : null}
							{duration ? (
								<Text type="secondary" className="text-xs">
									{duration}
								</Text>
							) : null}
							<Tag className="!m-0 !mt-1 w-fit">
								{row.campaigns.length} đợt mở
							</Tag>
						</div>
					</Card>
				);
			})}
		</Space>
	);
}

'use client';

import { Space, Tag, Typography } from 'antd';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import type { MockTestSelectExamTypeRow } from '@/lib/public-mock-test-online/select-exam-type-rows.util';
import {
	formatDurationMinutes,
	formatQuestionCountMeta,
} from '@/lib/public-mock-test-online/select-exam-type-rows.util';
import { MockTestOnlineCampaignPickList } from './MockTestOnlineCampaignPickList';

const { Title, Text } = Typography;

type Props = {
	row: MockTestSelectExamTypeRow | null;
	selectedSessionId: number | null;
	onSelectCampaign: (sessionId: number) => void;
	idPrefix?: string;
};

export function MockTestOnlineTypeDetailPanel({
	row,
	selectedSessionId,
	onSelectCampaign,
	idPrefix = 'mto-type-detail',
}: Props) {
	if (!row) {
		return (
			<Text type="secondary" id={idPrefix}>
				Chọn một loại bài bên trái để xem mô tả và các đợt thi đang mở.
			</Text>
		);
	}

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
		<div className="mto-type-detail" id={idPrefix}>
			<Title level={4} className="!mt-0 !mb-2">
				{row.displayNameVi}
			</Title>

			<Space size={[8, 8]} wrap className="!mb-3">
				{qMeta ? <Tag>{qMeta}</Tag> : null}
				{duration ? <Tag>{duration}</Tag> : null}
				<Tag color="blue">{row.campaigns.length} đợt đang mở</Tag>
			</Space>

			{row.highlightsVi?.length ? (
				<Space size={[6, 6]} wrap className="!mb-3">
					{row.highlightsVi.map((h) => (
						<Tag key={h} color="processing">
							{h}
						</Tag>
					))}
				</Space>
			) : null}

			{row.descriptionHtmlVi?.trim() ? (
				<div className="mto-type-detail-html !mb-4">
					<QaArticleHtml html={row.descriptionHtmlVi} />
				</div>
			) : null}

			<Text strong className="block !mb-2">
				Bài thi đang mở
			</Text>
			<MockTestOnlineCampaignPickList
				campaigns={row.campaigns}
				selectedSessionId={selectedSessionId}
				onSelect={onSelectCampaign}
				idPrefix={`${idPrefix}-campaigns`}
			/>
		</div>
	);
}

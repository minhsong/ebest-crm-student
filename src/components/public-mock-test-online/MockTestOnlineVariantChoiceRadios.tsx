'use client';

import { Radio, Typography } from 'antd';
import type { MockTestOnlineCampaign } from '@/lib/public-mock-test-online/types';
import { formatQuestionCountLabel } from '@/lib/public-mock-test-online/exam-flow.util';

const { Text } = Typography;

type Props = {
	campaign: MockTestOnlineCampaign;
};

/** Radio Full/Mini — số câu từ form (SX-07), không hard-code. */
export function MockTestOnlineVariantChoiceRadios({ campaign }: Props) {
	const fullHint =
		formatQuestionCountLabel(
			campaign.questionCount,
			'Mô phỏng bài thi đầy đủ',
		) ?? 'Mô phỏng bài thi đầy đủ';
	const miniHint =
		formatQuestionCountLabel(
			campaign.questionCountMini,
			'Làm nhanh, phù hợp lần thử đầu',
		) ?? 'Làm nhanh, phù hợp lần thử đầu';

	return (
		<Radio.Group className="mock-test-variant-radio-group">
			<Radio value="full">
				<Text strong>Đề đầy đủ (Full test)</Text>
				<Text type="secondary" className="block text-xs">
					{fullHint}
				</Text>
			</Radio>
			<Radio value="mini">
				<Text strong>Đề rút gọn (Mini test)</Text>
				<Text type="secondary" className="block text-xs">
					{miniHint}
				</Text>
			</Radio>
		</Radio.Group>
	);
}

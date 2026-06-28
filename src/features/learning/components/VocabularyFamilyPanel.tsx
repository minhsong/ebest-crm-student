'use client';

import { Space, Tag, Typography } from 'antd';
import type { VocabularyFamilyMemberSummary } from '@/types/learning';
import { resolveVocabularyTranslation } from '@/features/learning/utils/vocabulary-display.util';
import { VocabularyPosBadge } from '@/features/learning/components/VocabularyPosBadge';

type Props = {
	members: VocabularyFamilyMemberSummary[];
	currentId: number;
	sessionAssetIds?: Set<number>;
	onSelect?: (id: number) => void;
};

export function VocabularyFamilyPanel({
	members,
	currentId,
	sessionAssetIds,
	onSelect,
}: Props) {
	if (members.length <= 1) return null;

	return (
		<div className="vocab-word-detail__section vocab-word-detail__family">
			<span className="vocab-word-detail__section-title">Cùng họ từ</span>
			<Space direction="vertical" size={8} className="w-full">
				{members.map((member) => {
					const isCurrent = member.id === currentId;
					const inSession =
						!sessionAssetIds || sessionAssetIds.has(member.id);
					const meaning =
						member.translationPreview?.trim() ||
						resolveVocabularyTranslation(member);

					return (
						<button
							key={member.id}
							type="button"
							className={[
								'vocab-word-detail__family-item',
								isCurrent ? 'vocab-word-detail__family-item--active' : '',
								!inSession ? 'vocab-word-detail__family-item--disabled' : '',
							]
								.filter(Boolean)
								.join(' ')}
							disabled={isCurrent || !inSession}
							onClick={() => onSelect?.(member.id)}
							title={
								!inSession ? 'Biến thể này chưa có trong buổi học' : undefined
							}
						>
							<div className="vocab-word-detail__family-item-row">
								<div className="vocab-word-detail__family-item-text">
									<div className="vocab-word-detail__family-item-word-row">
										<Typography.Text strong={isCurrent} ellipsis>
											{member.word}
										</Typography.Text>
										<VocabularyPosBadge partOfSpeech={member.partOfSpeech} />
									</div>
									<Typography.Paragraph
										type="secondary"
										className="vocab-word-detail__family-item-meaning"
										ellipsis={{ rows: 1 }}
									>
										{meaning}
									</Typography.Paragraph>
								</div>
								<Space size={4} wrap className="vocab-word-detail__family-item-tags">
									{member.isPrimary ? (
										<Tag color="blue" className="mr-0">
											Chính
										</Tag>
									) : null}
									{isCurrent ? <Tag className="mr-0">Đang xem</Tag> : null}
								</Space>
							</div>
						</button>
					);
				})}
			</Space>
		</div>
	);
}

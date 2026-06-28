'use client';

import { MasteryBadge } from '@/features/learning/components/MasteryBadge';
import type { LearningVocabularyItem } from '@/types/learning';
import {
	getPreviewTranslation,
	getVocabularyHeadword,
} from '@/features/learning/utils/vocabulary-display.util';
import { VocabularyPosBadge } from '@/features/learning/components/VocabularyPosBadge';
import { Tag } from 'antd';

type Props = {
	item: LearningVocabularyItem;
	onSelect: (item: LearningVocabularyItem) => void;
};

export function VocabularyWordCard({ item, onSelect }: Props) {
	const { asset } = item;
	const hasImage = Boolean(asset.imageUrl?.trim());
	const headword = getVocabularyHeadword(asset);
	const siblingCount = asset.siblingCount ?? 0;

	return (
		<button
			type="button"
			className={[
				'session-vocabulary-word-card',
				hasImage ? 'session-vocabulary-word-card--with-image' : '',
			]
				.filter(Boolean)
				.join(' ')}
			onClick={() => onSelect(item)}
			aria-label={`Xem chi tiết từ ${headword}`}
		>
			{hasImage ? (
				<div className="session-vocabulary-word-card__media" aria-hidden>
					<img
						src={asset.imageUrl}
						alt=""
						className="session-vocabulary-word-card__image"
						loading="lazy"
					/>
				</div>
			) : null}
			<div
				className={[
					'session-vocabulary-word-card__body',
					hasImage ? '' : 'session-vocabulary-word-card__body--full',
				]
					.filter(Boolean)
					.join(' ')}
			>
				<div className="session-vocabulary-word-card__top">
					<span className="session-vocabulary-word-card__order">#{item.order}</span>
					<MasteryBadge
						state={item.progress.masteryState}
						label={item.progress.masteryLabel}
					/>
				</div>
				<p className="session-vocabulary-word-card__word-row">
					<span className="session-vocabulary-word-card__word">{headword}</span>
					<VocabularyPosBadge
						partOfSpeech={asset.partOfSpeech}
						partOfSpeechLabel={asset.partOfSpeechLabel}
						className="session-vocabulary-word-card__pos"
					/>
				</p>
				{asset.isPrimary === false ? (
					<Tag className="session-vocabulary-word-card__variant-tag">Biến thể</Tag>
				) : null}
				{asset.isPrimary && siblingCount > 0 ? (
					<Tag color="blue" className="session-vocabulary-word-card__variant-tag">
						+{siblingCount} biến thể
					</Tag>
				) : null}
				<p className="session-vocabulary-word-card__translation">
					{getPreviewTranslation(asset)}
				</p>
				<span className="session-vocabulary-word-card__hint">Xem chi tiết →</span>
			</div>
		</button>
	);
}

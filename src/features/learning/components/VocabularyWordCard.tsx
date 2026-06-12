'use client';

import { MasteryBadge } from '@/features/learning/components/MasteryBadge';
import type { LearningVocabularyItem } from '@/types/learning';
import { getPreviewTranslation } from '@/features/learning/utils/vocabulary-display.util';

type Props = {
	item: LearningVocabularyItem;
	onSelect: (item: LearningVocabularyItem) => void;
};

export function VocabularyWordCard({ item, onSelect }: Props) {
	const { asset } = item;
	const hasImage = Boolean(asset.imageUrl?.trim());

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
			aria-label={`Xem chi tiết từ ${asset.word}`}
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
				<p className="session-vocabulary-word-card__word">{asset.word}</p>
				<p className="session-vocabulary-word-card__translation">
					{getPreviewTranslation(asset)}
				</p>
				<span className="session-vocabulary-word-card__hint">Xem chi tiết →</span>
			</div>
		</button>
	);
}

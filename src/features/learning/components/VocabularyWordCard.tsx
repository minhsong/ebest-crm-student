'use client';

import { MasteryBadge } from '@/features/learning/components/MasteryBadge';
import type { LearningVocabularyItem } from '@/types/learning';
import { getPreviewTranslation } from '@/features/learning/utils/vocabulary-display.util';

type Props = {
	item: LearningVocabularyItem;
	onSelect: (item: LearningVocabularyItem) => void;
};

export function VocabularyWordCard({ item, onSelect }: Props) {
	return (
		<button
			type="button"
			className="session-vocabulary-word-card"
			onClick={() => onSelect(item)}
			aria-label={`Xem chi tiết từ ${item.asset.word}`}
		>
			<div className="session-vocabulary-word-card__top">
				<span className="session-vocabulary-word-card__order">#{item.order}</span>
				<MasteryBadge
					state={item.progress.masteryState}
					label={item.progress.masteryLabel}
				/>
			</div>
			<p className="session-vocabulary-word-card__word">{item.asset.word}</p>
			<p className="session-vocabulary-word-card__translation">
				{getPreviewTranslation(item.asset)}
			</p>
			<span className="session-vocabulary-word-card__hint">Xem chi tiết →</span>
		</button>
	);
}

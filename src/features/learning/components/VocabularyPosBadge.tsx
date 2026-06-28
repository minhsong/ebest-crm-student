'use client';

import { memo } from 'react';
import './vocabulary-pos-badge.css';

type Props = {
	partOfSpeech?: string | null;
	partOfSpeechLabel?: string | null;
	className?: string;
};

function VocabularyPosBadgeInner({
	partOfSpeech,
	partOfSpeechLabel,
	className,
}: Props) {
	const text = partOfSpeech?.trim() || partOfSpeechLabel?.trim();
	if (!text) return null;

	return (
		<span
			className={['vocabulary-pos-badge', className].filter(Boolean).join(' ')}
			aria-label={`Từ loại: ${text}`}
		>
			{text}
		</span>
	);
}

export const VocabularyPosBadge = memo(VocabularyPosBadgeInner);

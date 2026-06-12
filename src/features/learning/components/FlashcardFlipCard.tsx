'use client';

import type { KeyboardEvent } from 'react';
import { Typography } from 'antd';
import type { LearningVocabularyItem } from '@/types/learning';
import { VocabularyPronunciationRow } from '@/features/learning/components/VocabularyPronunciationRow';
import type { VocabularyPlayingLocale } from '@/features/learning/hooks/useVocabularyAudio';
import {
	getPrimaryMeaning,
	hasVocabularyPronunciation,
} from '@/features/learning/utils/vocabulary-display.util';

const { Title } = Typography;

export type FlashcardPlayingLocale = VocabularyPlayingLocale;

interface Props {
	item: LearningVocabularyItem;
	flipped: boolean;
	playingLocale: FlashcardPlayingLocale;
	onFlip: () => void;
	onPlayAudio: (locale: 'uk' | 'us', url?: string) => void;
}

export function FlashcardFlipCard({
	item,
	flipped,
	playingLocale,
	onFlip,
	onPlayAudio,
}: Props) {
	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onFlip();
		}
	};

	const meaning = getPrimaryMeaning(item.asset);
	const hasPronunciation = hasVocabularyPronunciation(item.asset);
	const hasImage = Boolean(item.asset.imageUrl);

	return (
		<div
			className={[
				'flashcard-flip-scene',
				hasImage ? 'flashcard-flip-scene--with-image' : '',
			]
				.filter(Boolean)
				.join(' ')}
			role="button"
			tabIndex={0}
			aria-label={
				flipped ? 'Mặt sau thẻ — chạm để lật lại' : 'Mặt trước thẻ — chạm để lật'
			}
			onClick={onFlip}
			onKeyDown={handleKeyDown}
		>
			<div className={`flashcard-flip-inner${flipped ? ' is-flipped' : ''}`}>
				<div className="flashcard-face flashcard-face--front">
					{hasImage ? (
						<div className="flashcard-face-media">
							<img
								src={item.asset.imageUrl}
								alt={item.asset.word}
								className="flashcard-face-image"
								draggable={false}
							/>
						</div>
					) : null}
					<div className="flashcard-face-main">
						<Title level={2} className="flashcard-word">
							{item.asset.word}
						</Title>
						{hasPronunciation ? (
							<div className="flashcard-pronunciation-list">
								<VocabularyPronunciationRow
									variant="flashcard"
									locale="uk"
									ipa={item.asset.ipaUk}
									audioUrl={item.asset.audioUkUrl}
									isPlaying={playingLocale === 'uk'}
									onPlay={onPlayAudio}
								/>
								<VocabularyPronunciationRow
									variant="flashcard"
									locale="us"
									ipa={item.asset.ipaUs}
									audioUrl={item.asset.audioUsUrl}
									isPlaying={playingLocale === 'us'}
									onPlay={onPlayAudio}
								/>
							</div>
						) : null}
					</div>
					<span className="flashcard-face-footer flashcard-hint">Chạm thẻ để lật</span>
				</div>

				<div className="flashcard-face flashcard-face--back">
					<div className="flashcard-face-main">
						<p className="flashcard-meaning">{meaning}</p>
						{item.asset.example ? (
							<span className="flashcard-example">{item.asset.example}</span>
						) : null}
						<span className="flashcard-word-back">{item.asset.word}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

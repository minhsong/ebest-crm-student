'use client';

import type { KeyboardEvent } from 'react';
import { Typography } from 'antd';
import type { LearningVocabularyItem } from '@/types/learning';
import { VocabularyPronunciationRow } from '@/features/learning/components/VocabularyPronunciationRow';
import { VocabularyPosBadge } from '@/features/learning/components/VocabularyPosBadge';
import type { VocabularyPlayingLocale } from '@/features/learning/hooks/useVocabularyAudio';
import { FLASHCARD_AUTO_PLAY_REPEATS } from '@/features/learning/games/flashcard-review/flashcard-auto-play.config';
import {
	getPrimaryMeaning,
	getVocabularyHeadword,
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
	flipDisabled?: boolean;
	/** 1..N khi Auto Play; 0 = ẩn badge. */
	autoPlayRepeatIndex?: number;
}

export function FlashcardFlipCard({
	item,
	flipped,
	playingLocale,
	onFlip,
	onPlayAudio,
	flipDisabled = false,
	autoPlayRepeatIndex = 0,
}: Props) {
	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (flipDisabled) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onFlip();
		}
	};

	const meaning = getPrimaryMeaning(item.asset);
	const hasPronunciation = hasVocabularyPronunciation(item.asset);
	const hasImage = Boolean(item.asset.imageUrl);
	const headword = getVocabularyHeadword(item.asset);

	return (
		<div
			className={[
				'flashcard-flip-scene',
				hasImage ? 'flashcard-flip-scene--with-image' : '',
				flipDisabled ? 'flashcard-flip-scene--auto-play' : '',
			]
				.filter(Boolean)
				.join(' ')}
			role={flipDisabled ? undefined : 'button'}
			tabIndex={flipDisabled ? -1 : 0}
			aria-label={
				flipDisabled
					? `Auto Play — ${headword}`
					: flipped
						? 'Mặt sau thẻ — chạm để lật lại'
						: `Mặt trước thẻ ${headword} — chạm để lật`
			}
			onClick={flipDisabled ? undefined : onFlip}
			onKeyDown={handleKeyDown}
		>
			<div className={`flashcard-flip-inner${flipped ? ' is-flipped' : ''}`}>
				<div className="flashcard-face flashcard-face--front">
					{autoPlayRepeatIndex > 0 ? (
						<span className="flashcard-auto-play-repeat-badge" aria-live="polite">
							{autoPlayRepeatIndex}/{FLASHCARD_AUTO_PLAY_REPEATS}
						</span>
					) : null}
					{hasImage ? (
						<div className="flashcard-face-media">
							<img
								src={item.asset.imageUrl}
								alt={headword}
								className="flashcard-face-image"
								draggable={false}
							/>
						</div>
					) : null}
					<div className="flashcard-face-main">
						<div className="flashcard-word-row">
							<Title level={2} className="flashcard-word">
								{headword}
							</Title>
							<VocabularyPosBadge
								partOfSpeech={item.asset.partOfSpeech}
								partOfSpeechLabel={item.asset.partOfSpeechLabel}
								className="flashcard-word__pos"
							/>
						</div>
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
					{!flipDisabled ? (
						<span className="flashcard-face-footer flashcard-hint">Chạm thẻ để lật</span>
					) : null}
				</div>

				<div className="flashcard-face flashcard-face--back">
					<div className="flashcard-face-main">
						<p className="flashcard-meaning">{meaning}</p>
						{item.asset.example ? (
							<span className="flashcard-example">{item.asset.example}</span>
						) : null}
						<div className="flashcard-word-back-row">
							<span className="flashcard-word-back">{headword}</span>
							<VocabularyPosBadge
								partOfSpeech={item.asset.partOfSpeech}
								partOfSpeechLabel={item.asset.partOfSpeechLabel}
								className="flashcard-word-back__pos"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


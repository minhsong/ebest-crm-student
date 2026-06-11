'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { Button, Tag, Typography } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import type { LearningVocabularyItem } from '@/types/learning';

const { Title } = Typography;

export type FlashcardPlayingLocale = 'uk' | 'us' | null;

interface Props {
	item: LearningVocabularyItem;
	flipped: boolean;
	playingLocale: FlashcardPlayingLocale;
	onFlip: () => void;
	onPlayAudio: (locale: 'uk' | 'us', url?: string) => void;
}

function stopBubble(e: MouseEvent) {
	e.stopPropagation();
}

function PronunciationRow({
	locale,
	ipa,
	audioUrl,
	isPlaying,
	onPlay,
}: {
	locale: 'uk' | 'us';
	ipa?: string;
	audioUrl?: string;
	isPlaying: boolean;
	onPlay: (locale: 'uk' | 'us', url?: string) => void;
}) {
	if (!ipa && !audioUrl) return null;

	const label = locale === 'uk' ? 'UK' : 'US';

	return (
		<div
			className={[
				'flashcard-pronunciation-row',
				`flashcard-pronunciation-row--${locale}`,
				isPlaying ? `flashcard-pronunciation-row--playing-${locale}` : '',
			]
				.filter(Boolean)
				.join(' ')}
		>
			<Tag
				className={`flashcard-locale-tag flashcard-locale-tag--${locale}`}
				bordered={false}
			>
				{label}
			</Tag>
			<span className="flashcard-pronunciation-ipa">{ipa || '—'}</span>
			{audioUrl ? (
				<Button
					type="text"
					shape="circle"
					size="small"
					className={`flashcard-pronunciation-speaker flashcard-pronunciation-speaker--${locale}`}
					icon={<SoundOutlined />}
					aria-label={`Nghe phát âm ${label}`}
					onClick={(e) => {
						stopBubble(e);
						onPlay(locale, audioUrl);
					}}
				/>
			) : (
				<span className="flashcard-pronunciation-speaker-placeholder" aria-hidden />
			)}
		</div>
	);
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

	const meaning =
		item.asset.translation || item.asset.meanings?.[0] || '—';

	const hasPronunciation =
		Boolean(item.asset.ipaUk || item.asset.ipaUs) ||
		Boolean(item.asset.audioUkUrl || item.asset.audioUsUrl);

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
			aria-label={flipped ? 'Mặt sau thẻ — chạm để lật lại' : 'Mặt trước thẻ — chạm để lật'}
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
								<PronunciationRow
									locale="uk"
									ipa={item.asset.ipaUk}
									audioUrl={item.asset.audioUkUrl}
									isPlaying={playingLocale === 'uk'}
									onPlay={onPlayAudio}
								/>
								<PronunciationRow
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

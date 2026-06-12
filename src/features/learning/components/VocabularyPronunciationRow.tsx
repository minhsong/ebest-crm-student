'use client';

import type { MouseEvent } from 'react';
import { Button, Tag } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import type { VocabularyAudioLocale } from '@/features/learning/hooks/useVocabularyAudio';

export type VocabularyPronunciationVariant = 'flashcard' | 'detail';

type Props = {
	variant: VocabularyPronunciationVariant;
	locale: VocabularyAudioLocale;
	ipa?: string;
	audioUrl?: string;
	isPlaying: boolean;
	onPlay: (locale: VocabularyAudioLocale, url?: string) => void;
};

function stopBubble(e: MouseEvent) {
	e.stopPropagation();
}

const VARIANT_CLASS: Record<
	VocabularyPronunciationVariant,
	{
		row: string;
		rowPlaying: (locale: VocabularyAudioLocale) => string;
		rowLocale: (locale: VocabularyAudioLocale) => string;
		tag: (locale: VocabularyAudioLocale) => string;
		ipa: string;
		speaker: (locale: VocabularyAudioLocale) => string;
		speakerPlaceholder: string;
	}
> = {
	flashcard: {
		row: 'flashcard-pronunciation-row',
		rowPlaying: (locale) => `flashcard-pronunciation-row--playing-${locale}`,
		rowLocale: (locale) => `flashcard-pronunciation-row--${locale}`,
		tag: (locale) => `flashcard-locale-tag flashcard-locale-tag--${locale}`,
		ipa: 'flashcard-pronunciation-ipa',
		speaker: (locale) =>
			`flashcard-pronunciation-speaker flashcard-pronunciation-speaker--${locale}`,
		speakerPlaceholder: 'flashcard-pronunciation-speaker-placeholder',
	},
	detail: {
		row: 'vocab-word-detail__pronunciation-row',
		rowPlaying: (locale) => `vocab-word-detail__pronunciation-row--playing-${locale}`,
		rowLocale: () => '',
		tag: (locale) =>
			`vocab-word-detail__locale-tag vocab-word-detail__locale-tag--${locale}`,
		ipa: 'vocab-word-detail__ipa',
		speaker: () => '',
		speakerPlaceholder: '',
	},
};

export function VocabularyPronunciationRow({
	variant,
	locale,
	ipa,
	audioUrl,
	isPlaying,
	onPlay,
}: Props) {
	if (!ipa && !audioUrl) {
		return null;
	}

	const classes = VARIANT_CLASS[variant];
	const label = locale === 'uk' ? 'UK' : 'US';

	return (
		<div
			className={[
				classes.row,
				classes.rowLocale(locale),
				isPlaying ? classes.rowPlaying(locale) : '',
			]
				.filter(Boolean)
				.join(' ')}
		>
			<Tag className={classes.tag(locale)} bordered={false}>
				{label}
			</Tag>
			<span className={classes.ipa}>{ipa || '—'}</span>
			{audioUrl ? (
				<Button
					type="text"
					shape="circle"
					size="small"
					className={classes.speaker(locale) || undefined}
					icon={<SoundOutlined />}
					aria-label={`Nghe phát âm ${label}`}
					onClick={(e) => {
						stopBubble(e);
						onPlay(locale, audioUrl);
					}}
				/>
			) : variant === 'flashcard' ? (
				<span className={classes.speakerPlaceholder} aria-hidden />
			) : null}
		</div>
	);
}

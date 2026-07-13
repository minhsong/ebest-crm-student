'use client';

import { Typography, Tag, Space } from 'antd';
import type { LearningVocabularyItem } from '@/types/learning';
import { MasteryBadge } from '@/features/learning/components/MasteryBadge';
import { VocabularyPronunciationRow } from '@/features/learning/components/VocabularyPronunciationRow';
import { VocabularyFamilyPanel } from '@/features/learning/components/VocabularyFamilyPanel';
import type { VocabularyPlayingLocale } from '@/features/learning/hooks/useVocabularyAudio';
import {
	formatAccuracyPercent,
	getExtraMeanings,
	getPrimaryMeaning,
	getVocabularyHeadword,
	hasVocabularyPronunciation,
} from '@/features/learning/utils/vocabulary-display.util';
import { VocabularyPosBadge } from '@/features/learning/components/VocabularyPosBadge';

const { Title } = Typography;

type Props = {
	item: LearningVocabularyItem;
	playingLocale: VocabularyPlayingLocale;
	onPlayAudio: (locale: 'uk' | 'us', url?: string) => void;
	sessionAssetIds?: Set<number>;
	onSelectFamilyMember?: (assetId: number) => void;
	/** Dictionary mode — hiện meaningEn, synonyms, domain tags */
	showExtendedDictionaryFields?: boolean;
	hideProgress?: boolean;
	/** Card grid biến thể đầy đủ (từ điển) vs list buổi học */
	familyPanelMode?: 'session' | 'dictionary';
};

export function VocabularyWordDetailPanel({
	item,
	playingLocale,
	onPlayAudio,
	sessionAssetIds,
	onSelectFamilyMember,
	showExtendedDictionaryFields = false,
	hideProgress = false,
	familyPanelMode = 'session',
}: Props) {
	const { asset, progress } = item;
	const primaryMeaning = getPrimaryMeaning(asset);
	const extraMeanings = getExtraMeanings(asset);
	const heroTitle = getVocabularyHeadword(asset);
	const familyMembers = asset.familyMembers ?? [];

	return (
		<div className="vocab-word-detail">
			<div className="vocab-word-detail__hero">
				{asset.imageUrl?.trim() ? (
					<div className="vocab-word-detail__image-wrap">
						<img
							src={asset.imageUrl}
							alt={asset.word}
							className="vocab-word-detail__image"
						/>
					</div>
				) : null}
				<div className="vocab-word-detail__hero-top">
					<div className="vocab-word-detail__word-row">
						<Title level={2} className="vocab-word-detail__word">
							{heroTitle}
						</Title>
						<VocabularyPosBadge
							partOfSpeech={asset.partOfSpeech}
							partOfSpeechLabel={asset.partOfSpeechLabel}
							className="vocab-word-detail__pos"
						/>
					</div>
					{hideProgress ? null : (
						<MasteryBadge
							state={progress.masteryState}
							label={progress.masteryLabel}
						/>
					)}
				</div>
			</div>

			{familyMembers.length > 0 ? (
				<VocabularyFamilyPanel
					members={familyMembers}
					currentId={asset.id}
					sessionAssetIds={sessionAssetIds}
					onSelect={onSelectFamilyMember}
					mode={familyPanelMode}
				/>
			) : null}

			<div className="vocab-word-detail__section">
				<span className="vocab-word-detail__section-title">Nghĩa</span>
				<p className="vocab-word-detail__meaning">{primaryMeaning}</p>
				{showExtendedDictionaryFields && asset.meaningEn?.trim() ? (
					<p className="vocab-word-detail__meaning-en">{asset.meaningEn}</p>
				) : null}
				{extraMeanings.length > 0 ? (
					<ul className="vocab-word-detail__meanings-list">
						{extraMeanings.map((meaning) => (
							<li key={meaning}>{meaning}</li>
						))}
					</ul>
				) : null}
			</div>

			{showExtendedDictionaryFields &&
			(asset.synonyms?.length || asset.antonyms?.length) ? (
				<div className="vocab-word-detail__section">
					{asset.synonyms?.length ? (
						<>
							<span className="vocab-word-detail__section-title">Đồng nghĩa</span>
							<p className="vocab-word-detail__tags-line">
								{asset.synonyms.join(', ')}
							</p>
						</>
					) : null}
					{asset.antonyms?.length ? (
						<>
							<span className="vocab-word-detail__section-title">Trái nghĩa</span>
							<p className="vocab-word-detail__tags-line">
								{asset.antonyms.join(', ')}
							</p>
						</>
					) : null}
				</div>
			) : null}

			{showExtendedDictionaryFields && asset.domainTags?.length ? (
				<div className="vocab-word-detail__section">
					<span className="vocab-word-detail__section-title">Chủ đề</span>
					<Space size={[4, 4]} wrap>
						{asset.domainTags.map((tag) => (
							<Tag key={tag.code}>{tag.name}</Tag>
						))}
					</Space>
				</div>
			) : null}

			{hasVocabularyPronunciation(asset) ? (
				<div className="vocab-word-detail__section">
					<span className="vocab-word-detail__section-title">Phát âm</span>
					<div className="vocab-word-detail__pronunciation-list">
						<VocabularyPronunciationRow
							variant="detail"
							locale="uk"
							ipa={asset.ipaUk}
							audioUrl={asset.audioUkUrl}
							isPlaying={playingLocale === 'uk'}
							onPlay={onPlayAudio}
						/>
						<VocabularyPronunciationRow
							variant="detail"
							locale="us"
							ipa={asset.ipaUs}
							audioUrl={asset.audioUsUrl}
							isPlaying={playingLocale === 'us'}
							onPlay={onPlayAudio}
						/>
					</div>
				</div>
			) : null}

			{asset.example ? (
				<div className="vocab-word-detail__section">
					<span className="vocab-word-detail__section-title">Ví dụ</span>
					<div className="vocab-word-detail__example-block">
						<p className="vocab-word-detail__example-en">{asset.example}</p>
						{asset.exampleTranslation ? (
							<p className="vocab-word-detail__example-vi">
								{asset.exampleTranslation}
							</p>
						) : null}
					</div>
				</div>
			) : null}

			{hideProgress ? null : (
			<div className="vocab-word-detail__section">
				<span className="vocab-word-detail__section-title">Tiến độ ôn tập</span>
				<div className="vocab-word-detail__progress-grid">
					<div className="vocab-word-detail__progress-item">
						<span className="vocab-word-detail__progress-label">Đã xem</span>
						<span className="vocab-word-detail__progress-value">
							{progress.timesSeen} lần
						</span>
					</div>
					<div className="vocab-word-detail__progress-item">
						<span className="vocab-word-detail__progress-label">Độ chính xác</span>
						<span className="vocab-word-detail__progress-value">
							{formatAccuracyPercent(progress.accuracyRate)}
						</span>
					</div>
					<div className="vocab-word-detail__progress-item">
						<span className="vocab-word-detail__progress-label">Biết</span>
						<span className="vocab-word-detail__progress-value">
							{progress.knownCount}
						</span>
					</div>
					<div className="vocab-word-detail__progress-item">
						<span className="vocab-word-detail__progress-label">Chưa thuộc</span>
						<span className="vocab-word-detail__progress-value">
							{progress.unknownCount}
						</span>
					</div>
				</div>
			</div>
			)}
		</div>
	);
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Button,
	Progress,
	Result,
	Skeleton,
	Space,
} from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import {
	completeFlashcardSession,
	fetchSessionVocabulary,
	reviewFlashcardCard,
	startFlashcardSession,
} from '@/lib/learning-api';
import type { FlashcardSessionCard, LearningVocabularyItem } from '@/types/learning';
import {
	flashcardBackHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { FlashcardFlipCard } from './FlashcardFlipCard';
import { playFlashcardFlipSound } from '../utils/flashcard-flip-sound';
import { useVocabularyAudio } from '@/features/learning/hooks/useVocabularyAudio';
import './flashcard-session.css';

type Phase = 'loading' | 'card' | 'done' | 'error';

function mapCardToVocabularyItem(
	card: FlashcardSessionCard,
	order: number,
): LearningVocabularyItem {
	return {
		order,
		asset: {
			id: card.assetId,
			assetType: 'vocabulary',
			word: card.word,
			translation: card.meaning,
			ipaUk: card.ipaUk,
			ipaUs: card.ipaUs,
			example: card.example,
			exampleTranslation: card.exampleTranslation,
			audioUkUrl: card.audioUkUrl,
			audioUsUrl: card.audioUsUrl,
			imageUrl: card.imageUrl,
			status: 'published',
		},
		progress: {
			assetId: card.assetId,
			masteryState: 'new',
			masteryLabel: 'Mới',
			firstSeenAt: null,
			lastSeenAt: null,
			timesSeen: 0,
			knownCount: 0,
			unknownCount: 0,
			accuracyRate: null,
			lastQuizAt: null,
		},
	};
}

export function FlashcardSessionView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const classId = Number(searchParams.get('classId'));
	const classSessionId = Number(searchParams.get('classSessionId'));

	const backHref = useMemo(
		() => flashcardBackHref(classId, classSessionId),
		[classId, classSessionId],
	);

	const [phase, setPhase] = useState<Phase>('loading');
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [items, setItems] = useState<LearningVocabularyItem[]>([]);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [knownCount, setKnownCount] = useState(0);
	const [unknownCount, setUnknownCount] = useState(0);
	const [sessionTitle, setSessionTitle] = useState('');
	const { playingLocale, playAudio, stopAudio } = useVocabularyAudio();

	const startRequestedRef = useRef(false);

	const current = items[index];
	const progressPercent = items.length
		? Math.round(((index + (phase === 'done' ? 1 : 0)) / items.length) * 100)
		: 0;

	useEffect(() => {
		if (!Number.isFinite(classId) || classId < 1 || !Number.isFinite(classSessionId) || classSessionId < 1) {
			setError('Thiếu tham số lớp hoặc buổi học.');
			setPhase('error');
			return;
		}
		if (startRequestedRef.current) return;
		startRequestedRef.current = true;

		void (async () => {
			try {
				const [session, vocabMeta] = await Promise.all([
					startFlashcardSession(classId, classSessionId),
					fetchSessionVocabulary(classId, classSessionId).catch(() => null),
				]);
				setSessionId(session.sessionId);
				setItems(session.cards.map((card, i) => mapCardToVocabularyItem(card, i + 1)));
				setSessionTitle(vocabMeta?.sessionTitle?.trim() || 'Buổi học');
				setPhase('card');
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Không bắt đầu được phiên flashcard.');
				setPhase('error');
			}
		})();
	}, [classId, classSessionId]);

	const finishSession = useCallback(
		async (known: number, unknown: number) => {
			if (sessionId) {
				try {
					await completeFlashcardSession(sessionId);
				} catch {
					// Summary local vẫn hiển thị nếu complete retry sau.
				}
			}
			setKnownCount(known);
			setUnknownCount(unknown);
			setPhase('done');
		},
		[sessionId],
	);

	const handlePlayAudio = useCallback(
		(locale: 'uk' | 'us', url?: string) => {
			if (!current || !url) return;
			playAudio(locale, url);
		},
		[current, playAudio],
	);

	useEffect(() => {
		stopAudio();
	}, [index, flipped, stopAudio]);

	const handleFlip = useCallback(() => {
		setFlipped((prev) => {
			playFlashcardFlipSound();
			return !prev;
		});
	}, []);

	useEffect(() => {
		if (phase !== 'card' || !current || flipped) return;

		const autoLocale: 'uk' | 'us' | null = current.asset.audioUsUrl
			? 'us'
			: current.asset.audioUkUrl
				? 'uk'
				: null;
		const autoUrl =
			autoLocale === 'us'
				? current.asset.audioUsUrl
				: autoLocale === 'uk'
					? current.asset.audioUkUrl
					: undefined;
		if (!autoLocale || !autoUrl) return;

		const timer = window.setTimeout(() => {
			handlePlayAudio(autoLocale, autoUrl);
		}, 300);

		return () => window.clearTimeout(timer);
	}, [phase, current, flipped, index, handlePlayAudio]);

	const handleRating = useCallback(
		async (selfRating: 'known' | 'unknown') => {
			if (!current || !flipped || !sessionId) return;

			try {
				await reviewFlashcardCard(sessionId, current.asset.id, selfRating);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Không ghi được đánh giá thẻ.');
				setPhase('error');
				return;
			}

			const nextKnown = knownCount + (selfRating === 'known' ? 1 : 0);
			const nextUnknown = unknownCount + (selfRating === 'unknown' ? 1 : 0);
			setKnownCount(nextKnown);
			setUnknownCount(nextUnknown);
			setFlipped(false);

			if (index + 1 >= items.length) {
				await finishSession(nextKnown, nextUnknown);
				return;
			}
			setIndex((i) => i + 1);
		},
		[
			current,
			flipped,
			sessionId,
			index,
			items.length,
			knownCount,
			unknownCount,
			finishSession,
		],
	);

	const summary = useMemo(
		() => ({ known: knownCount, unknown: unknownCount, total: items.length }),
		[knownCount, unknownCount, items.length],
	);

	if (phase === 'loading') {
		return (
			<div>
				<PageHeader title="Flashcard" />
				<Skeleton active paragraph={{ rows: 8 }} />
			</div>
		);
	}

	if (phase === 'error') {
		return (
			<div>
				<PageHeader
					title="Flashcard"
					leading={
						<Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(backHref)}>
							Quay lại
						</Button>
					}
				/>
				<Alert type="warning" showIcon message={error} />
			</div>
		);
	}

	if (phase === 'done') {
		return (
			<div>
				<Result
					status="success"
					title="Hoàn thành lượt luyện"
					subTitle={`${summary.known} từ biết · ${summary.unknown} từ chưa thuộc · ${summary.total} từ`}
					extra={[
						<Link key="back" href={backHref}>
							<Button type="primary">Về buổi học</Button>
						</Link>,
						<Link
							key="practice"
							href={
								Number.isFinite(classId)
									? vocabularyPracticeHref(classId)
									: '/learning/practice'
							}
						>
							<Button>Games</Button>
						</Link>,
					]}
				/>
			</div>
		);
	}

	return (
		<div className="flashcard-session-root">
			<PageHeader
				title="Flashcard"
				description={sessionTitle}
				leading={
					<Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(backHref)}>
						Quay lại
					</Button>
				}
			/>

			<div className="flashcard-session-body">
				<Progress percent={progressPercent} showInfo className="flashcard-session-progress" />

				<div className="flashcard-stage">
					{current ? (
						<FlashcardFlipCard
							item={current}
							flipped={flipped}
							playingLocale={playingLocale}
							onFlip={handleFlip}
							onPlayAudio={handlePlayAudio}
						/>
					) : null}
				</div>

				<div className="flashcard-actions">
					<Space size="middle">
						<Button
							type="primary"
							size="large"
							icon={<CheckOutlined />}
							disabled={!flipped}
							onClick={() => void handleRating('known')}
						>
							Biết
						</Button>
						<Button
							danger
							size="large"
							icon={<CloseOutlined />}
							disabled={!flipped}
							onClick={() => void handleRating('unknown')}
						>
							Chưa thuộc
						</Button>
					</Space>
				</div>

				<div className="flashcard-counter">
					Thẻ {index + 1} / {items.length}
				</div>
			</div>
		</div>
	);
}

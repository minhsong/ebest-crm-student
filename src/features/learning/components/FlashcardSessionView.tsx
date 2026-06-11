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
	buildActivityCompletedEvent,
	buildActivityStartedEvent,
	buildAssetAudioPlayedEvent,
	buildAssetReviewedEvent,
	buildAssetViewedEvent,
	buildFlashcardContext,
	createStudySessionId,
	flushLearningEvents,
} from '@/lib/learning-events';
import type { LearningEventItem, LearningVocabularyItem } from '@/types/learning';
import { useSessionVocabulary } from '@/features/learning/hooks/useSessionVocabulary';
import { getFlashcardReadOnlyErrorMessage } from '@/features/learning/utils/learning-access';
import {
	flashcardBackHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { FlashcardFlipCard, type FlashcardPlayingLocale } from './FlashcardFlipCard';
import { playFlashcardFlipSound } from '../utils/flashcard-flip-sound';
import './flashcard-session.css';

type Phase = 'loading' | 'card' | 'done' | 'error';

export function FlashcardSessionView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const classId = Number(searchParams.get('classId'));
	const classSessionId = Number(searchParams.get('classSessionId'));

	const backHref = useMemo(
		() => flashcardBackHref(classId, classSessionId),
		[classId, classSessionId],
	);

	const {
		items: fetchedItems,
		courseSessionId,
		canRecordEvents,
		readOnlyReason,
		loading: vocabularyLoading,
		error: vocabularyError,
	} = useSessionVocabulary({
		classId,
		classSessionId,
		loadErrorFallback: 'Không tải được từ vựng.',
		unlockErrorMessage: 'Buổi học chưa diễn ra — chưa thể luyện từ vựng buổi này.',
	});

	const [phase, setPhase] = useState<Phase>('loading');
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<LearningVocabularyItem[]>([]);
	const [index, setIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [knownCount, setKnownCount] = useState(0);
	const [unknownCount, setUnknownCount] = useState(0);
	const [sessionTitle, setSessionTitle] = useState('');
	const [playingLocale, setPlayingLocale] = useState<FlashcardPlayingLocale>(null);

	const studySessionIdRef = useRef<string>(createStudySessionId());
	const ctxRef = useRef<ReturnType<typeof buildFlashcardContext> | null>(null);
	const pendingEventsRef = useRef<LearningEventItem[]>([]);
	const viewedAssetIdsRef = useRef<Set<number>>(new Set());
	const startedRef = useRef(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const current = items[index];
	const progressPercent = items.length
		? Math.round(((index + (phase === 'done' ? 1 : 0)) / items.length) * 100)
		: 0;

	const flushPending = useCallback(async () => {
		const batch = pendingEventsRef.current.splice(0);
		if (!batch.length) return;
		try {
			await flushLearningEvents(batch);
		} catch {
			pendingEventsRef.current.unshift(...batch);
		}
	}, []);

	const queueEvent = useCallback((event: LearningEventItem) => {
		pendingEventsRef.current.push(event);
	}, []);

	useEffect(() => {
		if (vocabularyLoading) {
			setPhase('loading');
			return;
		}
		if (vocabularyError) {
			setError(vocabularyError);
			setPhase('error');
			return;
		}
		if (!canRecordEvents) {
			setError(getFlashcardReadOnlyErrorMessage(readOnlyReason));
			setPhase('error');
			return;
		}
		if (!fetchedItems.length) {
			setError('Buổi học chưa có từ vựng để luyện.');
			setPhase('error');
			return;
		}

		ctxRef.current = buildFlashcardContext({
			classId,
			classSessionId,
			courseSessionId: courseSessionId ?? undefined,
			studySessionId: studySessionIdRef.current,
		});
		setItems(fetchedItems);
		setSessionTitle(`Buổi ${classSessionId}`);
		setPhase('card');
	}, [
		canRecordEvents,
		classId,
		classSessionId,
		courseSessionId,
		fetchedItems,
		readOnlyReason,
		vocabularyError,
		vocabularyLoading,
	]);

	useEffect(() => {
		if (phase !== 'card' || !current || !ctxRef.current) return;
		if (!startedRef.current) {
			startedRef.current = true;
			queueEvent(buildActivityStartedEvent(ctxRef.current));
			void flushPending();
		}
		if (viewedAssetIdsRef.current.has(current.asset.id)) return;
		viewedAssetIdsRef.current.add(current.asset.id);
		queueEvent(buildAssetViewedEvent(ctxRef.current, current.asset.id));
		void flushPending();
	}, [phase, current, queueEvent, flushPending]);

	useEffect(() => {
		return () => {
			void flushPending();
		};
	}, [flushPending]);

	const finishSession = useCallback(
		async (known: number, unknown: number) => {
			if (ctxRef.current) {
				queueEvent(
					buildActivityCompletedEvent(ctxRef.current, {
						known,
						unknown,
						total: known + unknown,
					}),
				);
			}
			await flushPending();
			setPhase('done');
		},
		[queueEvent, flushPending],
	);

	const stopActiveAudio = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.onended = null;
			audioRef.current.onerror = null;
			audioRef.current = null;
		}
		setPlayingLocale(null);
	}, []);

	const handlePlayAudio = useCallback(
		(locale: 'uk' | 'us', url?: string) => {
			if (!current || !ctxRef.current || !url) return;

			stopActiveAudio();
			queueEvent(buildAssetAudioPlayedEvent(ctxRef.current, current.asset.id, locale));
			void flushPending();

			const audio = new Audio(url);
			audioRef.current = audio;
			setPlayingLocale(locale);
			audio.onended = () => {
				setPlayingLocale(null);
				audioRef.current = null;
			};
			audio.onerror = () => {
				setPlayingLocale(null);
				audioRef.current = null;
			};
			void audio.play().catch(() => {
				setPlayingLocale(null);
				audioRef.current = null;
			});
		},
		[current, queueEvent, flushPending, stopActiveAudio],
	);

	useEffect(() => {
		return () => {
			stopActiveAudio();
		};
	}, [stopActiveAudio]);

	useEffect(() => {
		stopActiveAudio();
	}, [index, flipped, stopActiveAudio]);

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
			if (!current || !ctxRef.current || !flipped) return;
			queueEvent(buildAssetReviewedEvent(ctxRef.current, current.asset.id, selfRating));
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
			await flushPending();
		},
		[
			current,
			flipped,
			index,
			items.length,
			knownCount,
			unknownCount,
			queueEvent,
			finishSession,
			flushPending,
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

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Progress, Skeleton } from 'antd';
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { FlashcardSessionResultScreen } from '@/features/learning/games/flashcard-review/presentation/FlashcardSessionResultScreen';
import { FlashcardSessionActions } from '@/features/learning/games/flashcard-review/presentation/FlashcardSessionActions';
import { useFlashcardSession } from '@/features/learning/games/flashcard-review/hooks/use-flashcard-session';
import { FlashcardFlipCard } from './FlashcardFlipCard';
import './flashcard-session.css';

export function FlashcardSessionView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const classId = Number(searchParams.get('classId'));
	const classSessionId = Number(searchParams.get('classSessionId'));

	const session = useFlashcardSession(classId, classSessionId);

	if (session.phase === 'loading') {
		return (
			<div>
				<PageHeader title="Flashcard" />
				<Skeleton active paragraph={{ rows: 8 }} />
			</div>
		);
	}

	if (session.phase === 'error') {
		return (
			<div>
				<PageHeader
					title="Flashcard"
					leading={
						<Button
							type="text"
							icon={<ArrowLeftOutlined />}
							onClick={() => router.push(session.backHref)}
						>
							Quay lại
						</Button>
					}
				/>
				<Alert type="warning" showIcon message={session.error} />
			</div>
		);
	}

	if (session.phase === 'done') {
		return (
			<div>
				<FlashcardSessionResultScreen
					presentation={session.presentation}
					known={session.summary.known}
					unknown={session.summary.unknown}
					total={session.summary.total}
					backHref={session.backHref}
					practiceHref={session.practiceHref}
				/>
			</div>
		);
	}

	return (
		<div className={`flashcard-session-root ${session.presentation.rootCssClass}`}>
			<PageHeader
				title="Flashcard"
				description={session.sessionTitle}
				leading={
					<Button
						type="text"
						icon={<ArrowLeftOutlined />}
						onClick={() => router.push(session.backHref)}
					>
						Quay lại
					</Button>
				}
			/>

			<div className="flashcard-session-body">
				<div className="flashcard-session-progress-row">
					<Progress
						percent={session.progressPercent}
						showInfo
						className="flashcard-session-progress"
					/>
					<Button
						type="default"
						size="small"
						icon={<SwapOutlined />}
						disabled={!session.canReshuffleRemaining || session.autoPlayActive}
						onClick={session.handleReshuffleRemaining}
						className="flashcard-reshuffle-btn"
						aria-label="Xáo lại thẻ còn lại"
					>
						Shuffle
					</Button>
				</div>

				<div className="flashcard-stage">
					{session.current ? (
						<FlashcardFlipCard
							item={session.current}
							flipped={session.flipped}
							playingLocale={session.cardPlayingLocale}
							onFlip={session.handleFlip}
							onPlayAudio={session.handlePlayAudio}
							flipDisabled={session.autoPlayActive}
							autoPlayRepeatIndex={
								session.autoPlayActive ? session.autoPlayRepeatIndex : 0
							}
						/>
					) : null}
				</div>

				<FlashcardSessionActions
					knownLabel={session.presentation.knownLabel}
					unknownLabel={session.presentation.unknownLabel}
					canRate={session.canRate}
					autoPlayActive={session.autoPlayActive}
					onStartAutoPlay={session.handleStartAutoPlay}
					onStopAutoPlay={session.handleStopAutoPlay}
					onRateKnown={() => session.handleRating('known')}
					onRateUnknown={() => session.handleRating('unknown')}
				/>

				<div className="flashcard-counter">
					Thẻ {session.index + 1} / {session.totalCards}
				</div>
			</div>
		</div>
	);
}

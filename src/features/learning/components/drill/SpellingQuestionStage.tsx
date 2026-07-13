'use client';

import { useEffect } from 'react';
import { Button, Typography } from 'antd';
import type { DrillQuestionClient } from '@/types/learning';
import { SpellingQuestionStem } from '@/features/learning/games/vocabulary-drill/presentation/detail/SpellingQuestionStem';
import { useSpellingTileState } from '@/features/learning/games/vocabulary-drill/use-spelling-tile-state';
import { DrillQuestionTimer } from './DrillQuestionTimer';
import { DrillFeedbackBurst } from './DrillFeedbackBurst';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';

const { Text } = Typography;

type Props = {
	question: DrillQuestionClient;
	feedback: GameAnswerFeedback;
	optionsLocked: boolean;
	secondsLeft: number;
	totalSeconds: number;
	onSubmit: (spellingTileIds: string[]) => void;
	onRegisterGetAnswerTiles?: (getter: (() => string[]) | null) => void;
};

export function SpellingQuestionStage({
	question,
	feedback,
	optionsLocked,
	secondsLeft,
	totalSeconds,
	onSubmit,
	onRegisterGetAnswerTiles,
}: Props) {
	const tiles = question.spellingTiles ?? [];
	const {
		tileById,
		slotTileIds,
		answerTileIds,
		answerSet,
		moveToAnswer,
		moveToPool,
		getAnswerTileIds,
	} = useSpellingTileState(question.questionId, tiles, optionsLocked);

	// Đăng ký lại khi đổi câu; chỉ hủy ref khi unmount — tránh null giữa cleanup/setup.
	useEffect(() => {
		onRegisterGetAnswerTiles?.(getAnswerTileIds);
	}, [question.questionId, getAnswerTileIds, onRegisterGetAnswerTiles]);

	useEffect(
		() => () => onRegisterGetAnswerTiles?.(null),
		[onRegisterGetAnswerTiles],
	);

	return (
		<div className="drill-survival-stage spelling-question-stage">
			<DrillQuestionTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
			<SpellingQuestionStem
				prompt={question.prompt}
				promptImageUrl={question.promptImageUrl}
			/>

			<div className="spelling-question-stage__section spelling-question-stage__section--pool">
				<div className="spelling-tile-grid spelling-tile-grid--pool">
					{slotTileIds.map((tileId) => {
						const tile = tileById.get(tileId);
						if (!tile) return null;
						const isSelected = answerSet.has(tileId);
						return (
							<Button
								key={tileId}
								size="large"
								className={`spelling-tile-btn spelling-tile-btn--pool${
									isSelected ? ' spelling-tile-btn--pool-selected' : ''
								}`}
								disabled={optionsLocked || isSelected}
								onClick={() => moveToAnswer(tileId)}
								aria-label={
									isSelected
										? `Chữ ${tile.letter}, đã chọn`
										: `Chữ ${tile.letter}, kho chữ`
								}
								aria-pressed={isSelected}
							>
								{tile.letter}
							</Button>
						);
					})}
				</div>
			</div>

			<div className="spelling-question-stage__section">
				<Text type="secondary" className="spelling-question-stage__label">
					Đáp án
				</Text>
				<div className="spelling-tile-grid spelling-tile-grid--answer">
					{answerTileIds.length === 0 ? (
						<Text type="secondary" className="spelling-question-stage__empty">
							Chạm các chữ cái phía trên để ghép từ
						</Text>
					) : null}
					{answerTileIds.map((tileId, index) => {
						const tile = tileById.get(tileId);
						if (!tile) return null;
						return (
							<Button
								key={`${tileId}-${index}`}
								size="large"
								className="spelling-tile-btn spelling-tile-btn--answer"
								disabled={optionsLocked}
								onClick={() => moveToPool(tileId)}
								aria-label={`Chữ ${tile.letter}, đáp án vị trí ${index + 1}`}
							>
								{tile.letter}
							</Button>
						);
					})}
				</div>
			</div>

			<Button
				type="primary"
				size="large"
				block
				className="spelling-question-stage__done"
				disabled={optionsLocked || answerTileIds.length === 0}
				onClick={() => onSubmit(answerTileIds)}
			>
				Xong
			</Button>

			<DrillFeedbackBurst feedback={feedback} />
		</div>
	);
}

import { useCallback, useState } from 'react';
import {
	startDrillSession,
	submitDrillAnswer,
} from '@/lib/learning-api';
import type { DrillGameMode } from '@/features/learning/hooks/useDrillPracticePool';
import type { DrillQuestionClient, DrillSessionClient } from '@/types/learning';

type Options = {
	effectiveClassId: number | null;
	assignmentId: number | null;
	resolvedGameMode: DrillGameMode;
	onSessionCompleted?: () => void;
};

export function useDrillPracticeSession({
	effectiveClassId,
	assignmentId,
	resolvedGameMode,
	onSessionCompleted,
}: Options) {
	const [session, setSession] = useState<DrillSessionClient | null>(null);
	const [question, setQuestion] = useState<DrillQuestionClient | null>(null);
	const [scoreInRun, setScoreInRun] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [finished, setFinished] = useState(false);
	const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const resetRunState = useCallback(() => {
		setFinished(false);
		setLastCorrect(null);
		setActionError(null);
	}, []);

	const handleStart = useCallback(async () => {
		if (!effectiveClassId) return;
		resetRunState();
		try {
			const started = await startDrillSession(effectiveClassId, {
				assignmentId: assignmentId ?? undefined,
				gameMode: resolvedGameMode,
			});
			setSession(started);
			setQuestion(started.question);
			setScoreInRun(started.scoreInRun);
		} catch (err) {
			setActionError(err instanceof Error ? err.message : 'Không bắt đầu được lượt luyện.');
		}
	}, [assignmentId, effectiveClassId, resetRunState, resolvedGameMode]);

	const handleAnswer = useCallback(
		async (selectedOptionId: string) => {
			if (!session || !question) return;
			setSubmitting(true);
			setActionError(null);
			try {
				const result = await submitDrillAnswer(
					session.playId,
					question.questionId,
					selectedOptionId,
				);
				setScoreInRun(result.scoreInRun);
				setLastCorrect(result.correct);
				if (result.completed) {
					setFinished(true);
					setQuestion(null);
					onSessionCompleted?.();
					return;
				}
				if (result.nextQuestion) {
					setQuestion(result.nextQuestion);
					setLastCorrect(null);
				}
			} catch (err) {
				setActionError(err instanceof Error ? err.message : 'Không gửi được câu trả lời.');
			} finally {
				setSubmitting(false);
			}
		},
		[onSessionCompleted, question, session],
	);

	return {
		session,
		question,
		scoreInRun,
		submitting,
		finished,
		lastCorrect,
		actionError,
		handleStart,
		handleAnswer,
	};
}

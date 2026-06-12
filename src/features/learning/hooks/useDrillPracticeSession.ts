import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import {
	fetchDrillSession,
	startDrillSession,
	submitDrillAnswer,
} from '@/lib/learning-api';

import { DRILL_ANSWER_TIMEOUT_SEC } from '@/features/learning/constants/drill-timing';
import {
	DRILL_WS,
	connectDrillRuntimeSocket,
	fetchDrillWsAccessToken,
} from '@/features/learning/lib/drill-runtime-ws-client';

import type { DrillGameMode } from '@/features/learning/hooks/useDrillPracticePool';

import { useDrillQuestionTimer } from '@/features/learning/hooks/useDrillQuestionTimer';

import type { DrillQuestionClient, DrillSessionClient } from '@/types/learning';



const FEEDBACK_CORRECT_MS = 480;

const FEEDBACK_WRONG_MS = 650;



export type DrillAnswerFeedback = 'correct' | 'wrong' | null;



type Options = {

	effectiveClassId: number | null;

	assignmentId: number | null;

	resolvedGameMode: DrillGameMode;

	playIdFromUrl: string | null;

	onPlayIdChange: (playId: string | null) => void;

	onSessionCompleted?: () => void;

};



function toSessionClient(

	started: Awaited<ReturnType<typeof startDrillSession>>,

): DrillSessionClient {

	return {

		playId: started.playId,

		classId: started.classId,

		assignmentId: started.assignmentId,

		gameMode: started.gameMode,

		scoreInRun: started.scoreInRun,

		streak: started.streak,

		status: started.status,

		question: started.question,

	};

}



export function useDrillPracticeSession({

	effectiveClassId,

	assignmentId,

	resolvedGameMode,

	playIdFromUrl,

	onPlayIdChange,

	onSessionCompleted,

}: Options) {

	const [session, setSession] = useState<DrillSessionClient | null>(null);

	const [question, setQuestion] = useState<DrillQuestionClient | null>(null);

	const [scoreInRun, setScoreInRun] = useState(0);

	const [streak, setStreak] = useState(0);

	const [submitting, setSubmitting] = useState(false);

	const [resuming, setResuming] = useState(false);

	const [finished, setFinished] = useState(false);

	const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

	const [feedback, setFeedback] = useState<DrillAnswerFeedback>(null);

	const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

	const [actionError, setActionError] = useState<string | null>(null);
	const [serverTimerSecondsLeft, setServerTimerSecondsLeft] = useState<number | null>(null);

	const feedbackTimerRef = useRef<number | null>(null);

	const resumeAttemptedRef = useRef<string | null>(null);

	const drillSocketRef = useRef<Socket | null>(null);

	const wsReadyRef = useRef(false);



	const clearFeedbackTimer = useCallback(() => {

		if (feedbackTimerRef.current != null) {

			window.clearTimeout(feedbackTimerRef.current);

			feedbackTimerRef.current = null;

		}

	}, []);



	useEffect(() => () => clearFeedbackTimer(), [clearFeedbackTimer]);

	useEffect(() => {
		if (!session?.playId || finished) {
			drillSocketRef.current?.removeAllListeners();
			drillSocketRef.current?.disconnect();
			drillSocketRef.current = null;
			wsReadyRef.current = false;
			return;
		}

		let cancelled = false;
		const playId = session.playId;

		const connect = async () => {
			const token = await fetchDrillWsAccessToken();
			if (cancelled || !token) return;
			try {
				const sock = connectDrillRuntimeSocket(token);
				drillSocketRef.current = sock;
				wsReadyRef.current = false;

				sock.on('connect', () => {
					sock.emit(DRILL_WS.JOIN, { playId });
				});
				sock.on(DRILL_WS.JOINED, () => {
					wsReadyRef.current = true;
				});
				sock.on(DRILL_WS.TIMER_SYNC, (payload: unknown) => {
					const p = payload as { playId?: string; secondsLeft?: number };
					if (p?.playId !== playId) return;
					if (typeof p.secondsLeft === 'number') {
						setServerTimerSecondsLeft(p.secondsLeft);
					}
				});
				sock.on('connect_error', () => {
					wsReadyRef.current = false;
				});
			} catch {
				wsReadyRef.current = false;
			}
		};

		void connect();

		return () => {
			cancelled = true;
			drillSocketRef.current?.removeAllListeners();
			drillSocketRef.current?.disconnect();
			drillSocketRef.current = null;
			wsReadyRef.current = false;
		};
	}, [finished, session?.playId]);



	const finishRun = useCallback(

		(wasCorrect: boolean | null) => {

			setLastCorrect(wasCorrect);

			setFinished(true);

			setQuestion(null);

			setFeedback(null);

			setSelectedOptionId(null);

			setStreak(0);

			onPlayIdChange(null);

			onSessionCompleted?.();

		},

		[onPlayIdChange, onSessionCompleted],

	);



	const showWrongFeedbackThenFinish = useCallback(() => {

		setFeedback('wrong');

		setStreak(0);

		clearFeedbackTimer();

		feedbackTimerRef.current = window.setTimeout(() => {

			finishRun(false);

		}, FEEDBACK_WRONG_MS);

	}, [clearFeedbackTimer, finishRun]);



	const resetRunState = useCallback(() => {

		clearFeedbackTimer();

		setSession(null);

		setQuestion(null);

		setScoreInRun(0);

		setFinished(false);

		setLastCorrect(null);

		setFeedback(null);

		setSelectedOptionId(null);

		setStreak(0);

		setActionError(null);

	}, [clearFeedbackTimer]);



	const handleStart = useCallback(async () => {

		if (!effectiveClassId) return;

		resetRunState();

		onPlayIdChange(null);

		try {

			const started = await startDrillSession(effectiveClassId, {

				assignmentId: assignmentId ?? undefined,

				gameMode: resolvedGameMode,

			});

			const nextSession = toSessionClient(started);

			setSession(nextSession);

			setQuestion(started.question);

			setScoreInRun(started.scoreInRun);

			setStreak(started.streak ?? 0);

			onPlayIdChange(started.playId);

		} catch (err) {

			setActionError(err instanceof Error ? err.message : 'Không bắt đầu được lượt luyện.');

		}

	}, [

		assignmentId,

		effectiveClassId,

		onPlayIdChange,

		resetRunState,

		resolvedGameMode,

	]);



	const submitAnswer = useCallback(

		async (options: { selectedOptionId?: string; timedOut?: boolean }) => {

			if (!session || !question || submitting || feedback) return;



			setSubmitting(true);

			if (options.selectedOptionId) {

				setSelectedOptionId(options.selectedOptionId);

			}

			setActionError(null);



			try {
				const wsPayload = {
					playId: session.playId,
					questionId: question.questionId,
					...(options.selectedOptionId
						? { selectedOptionId: options.selectedOptionId }
						: {}),
					...(options.timedOut ? { timedOut: true } : {}),
				};

				let result: Awaited<ReturnType<typeof submitDrillAnswer>>;
				if (wsReadyRef.current && drillSocketRef.current?.connected) {
					try {
						result = await new Promise<Awaited<ReturnType<typeof submitDrillAnswer>>>(
							(resolve, reject) => {
								const sock = drillSocketRef.current;
								if (!sock) {
									reject(new Error('WS unavailable'));
									return;
								}
								const timer = window.setTimeout(() => {
									sock.off(DRILL_WS.ANSWER_ACK, onAck);
									sock.off(DRILL_WS.ERROR, onErr);
									reject(new Error('WS timeout'));
								}, 8000);
								const onAck = (payload: unknown) => {
									window.clearTimeout(timer);
									sock.off(DRILL_WS.ANSWER_ACK, onAck);
									sock.off(DRILL_WS.ERROR, onErr);
									resolve(payload as Awaited<ReturnType<typeof submitDrillAnswer>>);
								};
								const onErr = () => {
									window.clearTimeout(timer);
									sock.off(DRILL_WS.ANSWER_ACK, onAck);
									sock.off(DRILL_WS.ERROR, onErr);
									reject(new Error('WS answer failed'));
								};
								sock.on(DRILL_WS.ANSWER_ACK, onAck);
								sock.on(DRILL_WS.ERROR, onErr);
								sock.emit(DRILL_WS.ANSWER, wsPayload);
							},
						);
					} catch {
						result = await submitDrillAnswer(
							session.playId,
							question.questionId,
							options,
						);
					}
				} else {
					result = await submitDrillAnswer(
						session.playId,
						question.questionId,
						options,
					);
				}

				setScoreInRun(result.scoreInRun);

				setLastCorrect(result.correct);

				setSubmitting(false);



				if (result.completed) {

					showWrongFeedbackThenFinish();

					return;

				}



				if (result.correct) {

					setStreak((s) => s + 1);

					setFeedback('correct');

					clearFeedbackTimer();

					feedbackTimerRef.current = window.setTimeout(() => {

						if (result.nextQuestion) {

							setQuestion(result.nextQuestion);

						}

						setFeedback(null);

						setSelectedOptionId(null);

						setLastCorrect(null);

					}, FEEDBACK_CORRECT_MS);

				}

			} catch (err) {

				setSubmitting(false);

				setSelectedOptionId(null);

				setActionError(err instanceof Error ? err.message : 'Không gửi được câu trả lời.');

			}

		},

		[clearFeedbackTimer, feedback, question, session, showWrongFeedbackThenFinish, submitting],

	);



	const handleAnswer = useCallback(

		(optionId: string) => void submitAnswer({ selectedOptionId: optionId }),

		[submitAnswer],

	);



	const handleTimeout = useCallback(

		() => void submitAnswer({ timedOut: true }),

		[submitAnswer],

	);



	useEffect(() => {

		if (!playIdFromUrl || session || finished) return;

		if (resumeAttemptedRef.current === playIdFromUrl) return;

		resumeAttemptedRef.current = playIdFromUrl;



		let cancelled = false;

		(async () => {

			setResuming(true);

			setActionError(null);

			try {

				const resumed = await fetchDrillSession(playIdFromUrl);

				if (cancelled) return;



				if (resumed.status === 'completed') {

					setSession({

						playId: resumed.playId,

						classId: resumed.classId,

						assignmentId: resumed.assignmentId,

						gameMode: resumed.gameMode,

						scoreInRun: resumed.scoreInRun,

						streak: 0,

						status: resumed.status,

						question: resumed.question ?? {

							questionId: '',

							prompt: '',

							promptType: 'meaning',

							options: [],

						},

					});

					setScoreInRun(resumed.scoreInRun);

					finishRun(null);

					return;

				}



				if (!resumed.question) {

					setActionError('Không tìm thấy câu hỏi đang chờ trong lượt luyện.');

					onPlayIdChange(null);

					return;

				}



				setSession({

					playId: resumed.playId,

					classId: resumed.classId,

					assignmentId: resumed.assignmentId,

					gameMode: resumed.gameMode,

					scoreInRun: resumed.scoreInRun,

					streak: resumed.streak,

					status: resumed.status,

					question: resumed.question,

				});

				setQuestion(resumed.question);

				setScoreInRun(resumed.scoreInRun);

				setStreak(resumed.streak);

			} catch (err) {

				if (!cancelled) {

					setActionError(

						err instanceof Error ? err.message : 'Không khôi phục được lượt luyện.',

					);

					onPlayIdChange(null);

				}

			} finally {

				if (!cancelled) setResuming(false);

			}

		})();



		return () => {

			cancelled = true;

		};

	}, [finishRun, finished, onPlayIdChange, playIdFromUrl, session]);



	const optionsLocked = submitting || feedback !== null || resuming;



	const { secondsLeft, totalSeconds } = useDrillQuestionTimer({

		questionId: question?.questionId ?? null,

		enabled: Boolean(session && question && !finished),

		paused: optionsLocked,

		seconds: DRILL_ANSWER_TIMEOUT_SEC,

		onTimeout: handleTimeout,

		serverSecondsLeft: serverTimerSecondsLeft,

	});

	useEffect(() => {
		setServerTimerSecondsLeft(null);
	}, [question?.questionId]);



	return {

		session,

		question,

		scoreInRun,

		streak,

		submitting,

		resuming,

		finished,

		lastCorrect,

		feedback,

		selectedOptionId,

		optionsLocked,

		actionError,

		secondsLeft,

		totalSeconds,

		handleStart,

		handleAnswer,

	};

};



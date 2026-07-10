import type { GameSessionState } from '@/features/learning/games/core/types/game-session.types';

export type GameSessionResumeContext = {
  scoreInRun: number;
  progress?: {
    answered: number;
    total: number;
    correct: number;
    wrong: number;
  } | null;
  lastAnswerCorrect?: boolean | null;
  runPassed?: boolean | null;
  gradebookSyncFailed?: boolean;
};

type ResumePayload<TQuestion> = {
  playId: string;
  classId: number;
  assignmentId: number | null;
  modeId: string;
  promptType: string;
  scoreInRun: number;
  streak: number;
  status: string;
  question?: TQuestion;
} & Omit<GameSessionResumeContext, 'scoreInRun'>;

type ResumeOptions<TSession extends GameSessionState<TQuestion>, TQuestion> = {
  playId: string;
  /** Khi shell reconcile đã GET play — tránh fetch trùng. */
  prefetchedPayload?: ResumePayload<TQuestion> | null;
  fetchSession: (playId: string) => Promise<
    {
      playId: string;
      classId: number;
      assignmentId: number | null;
      modeId: string;
      promptType: string;
      scoreInRun: number;
      streak: number;
      status: string;
      question?: TQuestion;
    } & Omit<GameSessionResumeContext, 'scoreInRun'>
  >;
  toSession: (
    resumed: Awaited<ReturnType<ResumeOptions<TSession, TQuestion>['fetchSession']>>,
  ) => TSession;
  onCompleted: (session: TSession, ctx: GameSessionResumeContext) => void;
  onActive: (session: TSession, question: TQuestion, ctx: GameSessionResumeContext) => void;
  onError: (message: string) => void;
  missingQuestionMessage?: string;
};

/** Generic resume flow — GET play, handle completed vs in-progress (GE-V4). */
export async function resumeGameSession<TSession extends GameSessionState<TQuestion>, TQuestion>(
  options: ResumeOptions<TSession, TQuestion>,
): Promise<void> {
  const {
    playId,
    prefetchedPayload,
    fetchSession,
    toSession,
    onCompleted,
    onActive,
    onError,
    missingQuestionMessage = 'Không tìm thấy câu hỏi đang chờ trong lượt chơi.',
  } = options;

  const resumed =
    prefetchedPayload?.playId === playId
      ? prefetchedPayload
      : await fetchSession(playId);
  const resumeCtx: GameSessionResumeContext = {
    scoreInRun: resumed.scoreInRun,
    progress: resumed.progress,
    lastAnswerCorrect: resumed.lastAnswerCorrect,
    runPassed: resumed.runPassed,
    gradebookSyncFailed:
      'gradebookSyncFailed' in resumed ? resumed.gradebookSyncFailed : undefined,
  };

  if (resumed.status === 'completed') {
    const session = toSession(resumed);
    onCompleted(session, resumeCtx);
    return;
  }

  if (!resumed.question) {
    onError(missingQuestionMessage);
    return;
  }

  const session = toSession({ ...resumed, question: resumed.question });
  onActive(session, resumed.question, resumeCtx);
}

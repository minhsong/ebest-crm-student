export type GameAnswerFeedback = 'correct' | 'wrong' | null;

export type GameSessionState<TQuestion> = {
  playId: string;
  classId: number;
  assignmentId: number | null;
  modeId: string;
  promptType: string;
  scoreInRun: number;
  streak: number;
  status: string;
  question: TQuestion;
};

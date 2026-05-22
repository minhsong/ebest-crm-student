/** Bài ghi âm / speaking — có nhận xét timeline trên portal. */
export function isMediaSpeakingExercise(
  exerciseType: string | null | undefined,
): boolean {
  const ex = (exerciseType ?? '').toLowerCase();
  return ex === 'recording' || ex === 'speaking';
}

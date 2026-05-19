/** Khớp `quizSectionListeningStorageKey` trên gateway (`quiz-listening.util.ts`). */
export function quizSectionListeningStorageKey(sectionId: number): string {
  return `section:${sectionId}`;
}

import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

import {
  resolveVocabularyDrillPresentationFromSessionConfig,
  type VocabularyDrillPresentationProfile,
  type VocabularyDrillResultProfileId,
} from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';

import { buildVocabularyDrillLobbyViewModel } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-lobby.mapper';

import {
  resolveFlashcardReviewPresentationFromSessionConfig,
  type FlashcardReviewPresentationProfile,
  type FlashcardReviewSessionConfigLike,
} from '@/features/learning/games/flashcard-review/flashcard-review-presentation.mapper';

import type { AssignmentDrillContextPayload } from '@/types/learning';

export function getVocabularyDrillPresentation(
  sessionConfig: GameSessionConfig | null,
): VocabularyDrillPresentationProfile | null {
  if (!sessionConfig) return null;
  return resolveVocabularyDrillPresentationFromSessionConfig(sessionConfig);
}

export function getVocabularyDrillLobbyViewModel(input: {
  sessionConfig: GameSessionConfig | null;
  assignmentCtx: AssignmentDrillContextPayload | null;
}) {
  return buildVocabularyDrillLobbyViewModel(input);
}

export function resolveVocabularyDrillResultProfileId(
  sessionConfig: GameSessionConfig | null,
): VocabularyDrillResultProfileId {
  const profile = getVocabularyDrillPresentation(sessionConfig);
  return profile?.resultProfileId ?? 'survival_result';
}

export function getFlashcardReviewPresentation(
  sessionConfig: FlashcardReviewSessionConfigLike | null | undefined,
): FlashcardReviewPresentationProfile {
  return resolveFlashcardReviewPresentationFromSessionConfig(sessionConfig);
}

export type { VocabularyDrillPresentationProfile, VocabularyDrillResultProfileId };
export type { FlashcardReviewPresentationProfile, FlashcardReviewSessionConfigLike };
export { buildVocabularyDrillLobbyViewModel };

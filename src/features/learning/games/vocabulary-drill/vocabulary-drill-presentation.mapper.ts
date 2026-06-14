import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
export type VocabularyDrillModeLayoutProfileId =
  | 'survival_streak'
  | 'pool_coverage_progress';

export type VocabularyDrillResultProfileId = 'survival_result' | 'pool_coverage_result';

export type VocabularyDrillDetailWidgetId = 'meaning_mcq' | 'audio_mcq';

export type VocabularyDrillLobbyProfileId =
  | 'free_practice'
  | 'assignment_survival'
  | 'assignment_pool_coverage';

export type VocabularyDrillPresentationProfile = {
  modeLayoutProfileId: VocabularyDrillModeLayoutProfileId;
  resultProfileId: VocabularyDrillResultProfileId;
  lobbyProfileId: VocabularyDrillLobbyProfileId;
  detailWidgetId: VocabularyDrillDetailWidgetId;
  modeLabel: string;
  usesStreakHud: boolean;
  usesPoolProgressBar: boolean;
};

const MODE_LABELS: Record<GameSessionConfig['modeId'], string> = {
  survival: 'Survival',
  pool_coverage: 'Kiểm tra thuộc từ',
};

const LOBBY_BY_MODE: Record<GameSessionConfig['modeId'], VocabularyDrillLobbyProfileId> = {
  survival: 'free_practice',
  pool_coverage: 'assignment_pool_coverage',
};

export function resolveVocabularyDrillPresentationFromSessionConfig(
  sessionConfig: GameSessionConfig,
): VocabularyDrillPresentationProfile {
  const { modeId, promptType, presentation } = sessionConfig;
  const usesStreakHud = modeId === 'survival';
  const usesPoolProgressBar = modeId === 'pool_coverage';
  const modeLabel =
    promptType === 'audio_to_word' && modeId === 'survival'
      ? 'Nghe'
      : MODE_LABELS[modeId];

  return {
    modeLayoutProfileId: presentation.modeLayoutProfileId as VocabularyDrillModeLayoutProfileId,
    resultProfileId: (presentation.resultProfileId ?? 'survival_result') as VocabularyDrillResultProfileId,
    lobbyProfileId: LOBBY_BY_MODE[modeId],
    detailWidgetId: presentation.detailWidgetId as VocabularyDrillDetailWidgetId,
    modeLabel,
    usesStreakHud,
    usesPoolProgressBar,
  };
}

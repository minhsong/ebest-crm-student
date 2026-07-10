import type { GameSessionConfig } from '@ebest/game-engine-core';
import { resolveVocabularyDrillModePresentationFields } from './vocabulary-drill-mode-presentation.utils';
export type VocabularyDrillModeLayoutProfileId =
  | 'survival_streak'
  | 'pool_coverage_progress'
  | 'speed_run_timer';

export type VocabularyDrillResultProfileId =
  | 'survival_result'
  | 'pool_coverage_result'
  | 'speed_run_result';

export type VocabularyDrillDetailWidgetId =
  | 'meaning_mcq'
  | 'audio_mcq'
  | 'image_mcq'
  | 'word_image_mcq';

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

export function resolveVocabularyDrillPresentationFromSessionConfig(
  sessionConfig: GameSessionConfig,
): VocabularyDrillPresentationProfile {
  const { modeId, promptType, presentation } = sessionConfig;
  const modeFields = resolveVocabularyDrillModePresentationFields(modeId, promptType);

  return {
    modeLayoutProfileId: presentation.modeLayoutProfileId as VocabularyDrillModeLayoutProfileId,
    resultProfileId: (presentation.resultProfileId ?? modeFields.resultProfileId) as VocabularyDrillResultProfileId,
    lobbyProfileId: modeFields.lobbyProfileId,
    detailWidgetId: presentation.detailWidgetId as VocabularyDrillDetailWidgetId,
    modeLabel: modeFields.modeLabel,
    usesStreakHud: modeFields.usesStreakHud,
    usesPoolProgressBar: modeFields.usesPoolProgressBar,
  };
}

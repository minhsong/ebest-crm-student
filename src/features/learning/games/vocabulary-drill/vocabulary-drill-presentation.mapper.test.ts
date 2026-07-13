import { describe, expect, it } from 'vitest';

import {
  resolveVocabularyDrillPresentationFromSessionConfig,
} from './vocabulary-drill-presentation.mapper';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

function mockSessionConfig(
  overrides: Pick<GameSessionConfig, 'modeId' | 'promptType'> &
    Partial<Pick<GameSessionConfig, 'presentation'>>,
): GameSessionConfig {
  const presentation =
    overrides.presentation ??
    (overrides.promptType === 'audio_to_word'
      ? {
          coreLayoutProfileId: 'default_game_shell',
          modeLayoutProfileId: 'survival_streak',
          detailWidgetId: 'audio_mcq',
          resultProfileId: 'survival_result',
        }
      : overrides.modeId === 'pool_coverage'
        ? {
            coreLayoutProfileId: 'default_game_shell',
            modeLayoutProfileId: 'pool_coverage_progress',
            detailWidgetId: 'meaning_mcq',
            resultProfileId: 'pool_coverage_result',
          }
        : overrides.modeId === 'speed_run'
          ? {
              coreLayoutProfileId: 'default_game_shell',
              modeLayoutProfileId: 'speed_run_timer',
              detailWidgetId: 'meaning_mcq',
              resultProfileId: 'speed_run_result',
            }
          : {
            coreLayoutProfileId: 'default_game_shell',
            modeLayoutProfileId: 'survival_streak',
            detailWidgetId: 'meaning_mcq',
            resultProfileId: 'survival_result',
          });

  return {
    gameFamily: 'vocabulary_drill',
    modeId: overrides.modeId,
    promptType: overrides.promptType,
    rules: {
      answerTimeoutSec: 10,
      optionCount: 4,
      allowRetrySameItem: false,
      ...(overrides.modeId === 'speed_run' ? { sessionDurationSec: 90 } : {}),
    },
    scoring: {
      strategyId:
        overrides.modeId === 'pool_coverage'
          ? 'accuracy_ratio'
          : overrides.modeId === 'speed_run'
            ? 'correct_count_in_window'
            : 'streak_correct',
      pointsPerCorrect: 1,
    },
    completion: {
      sessionPolicyId:
        overrides.modeId === 'pool_coverage'
          ? 'end_on_pool_exhausted'
          : overrides.modeId === 'speed_run'
            ? 'end_on_timer'
            : 'end_on_wrong',
      syncAssignmentOn:
        overrides.modeId === 'pool_coverage'
          ? 'run_completed'
          : overrides.modeId === 'speed_run'
            ? 'run_completed'
            : 'never',
    },
    source: { kind: 'vocabulary_pool', itemIds: [], batchSize: 20 },
    presentation,
  };
}

describe('resolveVocabularyDrillPresentationFromSessionConfig', () => {
  it('maps survival meaning_to_word', () => {
    const profile = resolveVocabularyDrillPresentationFromSessionConfig(
      mockSessionConfig({ modeId: 'survival', promptType: 'meaning_to_word' }),
    );
    expect(profile.modeLayoutProfileId).toBe('survival_streak');
    expect(profile.detailWidgetId).toBe('meaning_mcq');
    expect(profile.usesStreakHud).toBe(true);
    expect(profile.usesPoolProgressBar).toBe(false);
  });

  it('maps survival audio_to_word', () => {
    const profile = resolveVocabularyDrillPresentationFromSessionConfig(
      mockSessionConfig({ modeId: 'survival', promptType: 'audio_to_word' }),
    );
    expect(profile.detailWidgetId).toBe('audio_mcq');
    expect(profile.modeLabel).toBe('Nghe');
    expect(profile.usesStreakHud).toBe(true);
  });

	it('maps speed_run with session timer layout', () => {
    const profile = resolveVocabularyDrillPresentationFromSessionConfig(
      mockSessionConfig({ modeId: 'speed_run', promptType: 'meaning_to_word' }),
    );
    expect(profile.modeLayoutProfileId).toBe('speed_run_timer');
    expect(profile.resultProfileId).toBe('speed_run_result');
    expect(profile.modeLabel).toBe('Speed run');
    expect(profile.usesStreakHud).toBe(false);
    expect(profile.usesPoolProgressBar).toBe(false);
  });

  it('maps survival spelling to spelling_tiles widget', () => {
    const profile = resolveVocabularyDrillPresentationFromSessionConfig(
      mockSessionConfig({
        modeId: 'survival',
        promptType: 'spelling',
        presentation: {
          coreLayoutProfileId: 'default_game_shell',
          modeLayoutProfileId: 'survival_streak',
          detailWidgetId: 'spelling_tiles',
          resultProfileId: 'survival_result',
        },
      }),
    );
    expect(profile.detailWidgetId).toBe('spelling_tiles');
    expect(profile.usesStreakHud).toBe(true);
  });
});

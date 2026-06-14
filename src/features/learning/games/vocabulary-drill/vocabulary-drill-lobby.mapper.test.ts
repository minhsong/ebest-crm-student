import { buildVocabularyDrillLobbyViewModel } from './vocabulary-drill-lobby.mapper';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

function mockSessionConfig(
  modeId: GameSessionConfig['modeId'],
  promptType: GameSessionConfig['promptType'] = 'meaning_to_word',
): GameSessionConfig {
  return {
    gameFamily: 'vocabulary_drill',
    modeId,
    promptType,
    rules: { answerTimeoutSec: 10, optionCount: 4, allowRetrySameItem: false },
    scoring: {
      strategyId: modeId === 'pool_coverage' ? 'accuracy_ratio' : 'streak_correct',
      pointsPerCorrect: 1,
    },
    completion: {
      sessionPolicyId: modeId === 'pool_coverage' ? 'end_on_pool_exhausted' : 'end_on_wrong',
      syncAssignmentOn: modeId === 'pool_coverage' ? 'run_completed' : 'never',
    },
    source: {
      kind: modeId === 'pool_coverage' ? 'vocabulary_selection' : 'vocabulary_pool',
      itemIds: [],
      batchSize: 20,
    },
    presentation: {
      coreLayoutProfileId: 'default_game_shell',
      modeLayoutProfileId:
        modeId === 'pool_coverage' ? 'pool_coverage_progress' : 'survival_streak',
      detailWidgetId: promptType === 'audio_to_word' ? 'audio_mcq' : 'meaning_mcq',
      resultProfileId: modeId === 'pool_coverage' ? 'pool_coverage_result' : 'survival_result',
    },
  };
}

describe('buildVocabularyDrillLobbyViewModel', () => {
  it('builds pool coverage assignment lobby', () => {
    const vm = buildVocabularyDrillLobbyViewModel({
      sessionConfig: mockSessionConfig('pool_coverage'),
      assignmentCtx: {
        assignmentId: 1,
        classId: 2,
        title: 'Bài kiểm tra',
        minimumScore: 8,
        modeId: 'pool_coverage',
        promptType: 'meaning_to_word',
        assignmentPoolSize: 12,
        unlockPoolSize: 20,
        bestScore: 6,
        bestTotal: 12,
        assignmentComplete: false,
        canPlay: true,
      },
    });

    expect(vm?.profileId).toBe('assignment_pool_coverage');
    expect(vm?.presentation.usesPoolProgressBar).toBe(true);
    expect(vm?.showModePicker).toBe(false);
    expect(vm?.stats).toHaveLength(3);
    expect(vm?.footerHint).toContain('Chế độ kiểm tra thuộc từ');
  });

  it('uses sessionConfig.presentation.lobby copy when provided', () => {
    const sessionConfig = mockSessionConfig('survival');
    sessionConfig.presentation.lobby = {
      freePractice: {
        eyebrow: 'Custom eyebrow',
        title: 'Custom title',
        description: 'Custom description',
        ctaLabel: 'Custom CTA',
      },
    };

    const vm = buildVocabularyDrillLobbyViewModel({
      sessionConfig,
      assignmentCtx: null,
    });

    expect(vm?.eyebrow).toBe('Custom eyebrow');
    expect(vm?.title).toBe('Custom title');
    expect(vm?.description).toBe('Custom description');
    expect(vm?.ctaLabel).toBe('Custom CTA');
  });

  it('builds free practice lobby with mode picker', () => {
    const vm = buildVocabularyDrillLobbyViewModel({
      sessionConfig: mockSessionConfig('survival'),
      assignmentCtx: null,
    });

    expect(vm?.profileId).toBe('free_practice');
    expect(vm?.showModePicker).toBe(true);
    expect(vm?.presentation.usesStreakHud).toBe(true);
  });
});

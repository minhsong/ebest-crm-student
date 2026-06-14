/** Portal mirror of CRM GameSessionConfig (GE-V2). */

export type GameSessionConfig = {
  gameFamily: 'vocabulary_drill';

  modeId: 'survival' | 'pool_coverage';

  promptType: 'meaning_to_word' | 'audio_to_word';

  rules: {

    answerTimeoutSec: number;

    optionCount: number;

    allowRetrySameItem: boolean;

  };

  scoring: {

    strategyId: 'streak_correct' | 'accuracy_ratio';

    pointsPerCorrect: number;

    minimumToPass?: number;

  };

  completion: {

    sessionPolicyId: 'end_on_wrong' | 'end_on_pool_exhausted';

    syncAssignmentOn: 'never' | 'threshold_reached' | 'run_completed';

  };

  source: {

    kind: 'vocabulary_pool' | 'vocabulary_selection';

    itemIds: string[];

    batchSize: number;

  };

  presentation: {

    coreLayoutProfileId: string;

    modeLayoutProfileId: string;

    detailWidgetId: string;

    resultProfileId?: string;

    lobby?: {

      freePractice?: {

        eyebrow: string;

        title: string;

        description: string;

        ctaLabel: string;

      };

      assignment?: {

        eyebrow: string;

        ctaLabel: string;

        descriptionActive: string;

        descriptionComplete: string;

        statMinimumLabel: string;

        statBestLabel: string;

        statPoolLabel: string;

        footerHint?: string;

      };

    };

  };

  context?: {

    classId: number;

    courseId: number | null;

    assignmentId: number | null;

    customerId: number;

  };

};


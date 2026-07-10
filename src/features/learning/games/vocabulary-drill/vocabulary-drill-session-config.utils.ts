import type { AssignmentDrillContextPayload } from '@/types/learning';
import {
	buildVocabularyDrillSessionConfigStub,
	isVocabularyDrillPromptType,
} from '@ebest/game-vocabulary-drill';
import type { GameSessionConfig } from '@ebest/game-engine-core';

export { isVocabularyDrillPromptType };

/** Lobby stub — delegate catalog assembler (GE SSOT). */
export function inferVocabularyDrillSessionConfigFromAssignment(
	ctx: Pick<AssignmentDrillContextPayload, 'modeId' | 'promptType' | 'assignmentId'>,
): GameSessionConfig {
	return buildVocabularyDrillSessionConfigStub({
		modeId: ctx.modeId,
		promptType: ctx.promptType,
		assignmentId: ctx.assignmentId,
		minimumScore: null,
	});
}

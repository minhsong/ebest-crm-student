import type { VocabularyDrillModeId, VocabularyDrillPromptType } from '@ebest/game-engine-core';
import { resolveVocabularyDrillModePresentationFields as resolveFromCatalog } from '@ebest/game-vocabulary-drill';
import type {
	VocabularyDrillLobbyProfileId,
	VocabularyDrillModeLayoutProfileId,
	VocabularyDrillPresentationProfile,
	VocabularyDrillResultProfileId,
} from './vocabulary-drill-presentation.mapper';

/** Portal adapter — cast catalog fields sang presentation profile types. */
export function resolveVocabularyDrillModePresentationFields(
	modeId: VocabularyDrillModeId,
	promptType: VocabularyDrillPromptType,
): Pick<
	VocabularyDrillPresentationProfile,
	| 'modeLayoutProfileId'
	| 'resultProfileId'
	| 'lobbyProfileId'
	| 'modeLabel'
	| 'usesStreakHud'
	| 'usesPoolProgressBar'
> {
	const fields = resolveFromCatalog(modeId, promptType);
	return {
		modeLayoutProfileId: fields.modeLayoutProfileId as VocabularyDrillModeLayoutProfileId,
		resultProfileId: fields.resultProfileId as VocabularyDrillResultProfileId,
		lobbyProfileId: fields.lobbyProfileId as VocabularyDrillLobbyProfileId,
		modeLabel: fields.modeLabel,
		usesStreakHud: fields.usesStreakHud,
		usesPoolProgressBar: fields.usesPoolProgressBar,
	};
}

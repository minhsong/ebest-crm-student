/** Catalog SSOT — alias engine prompt types cho Portal game hub. */
export type GamePromptType = import('@ebest/game-engine-core').VocabularyDrillPromptType;

export type GameCatalogEntry = {
	slug: string;
	promptType: GamePromptType;
	title: string;
	description: string;
	/** Survival mode ship status */
	shipped: boolean;
};

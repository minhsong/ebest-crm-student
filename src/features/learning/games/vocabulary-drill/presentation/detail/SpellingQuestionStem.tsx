'use client';

import { ImageMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/ImageMcqPrompt';
import { MeaningMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/MeaningMcqPrompt';

type Props = {
	prompt: string;
	promptImageUrl?: string;
};

/** Spelling stem — ảnh minh họa + nghĩa VI (SPELLING_GAME_SPEC §5). */
export function SpellingQuestionStem({ prompt, promptImageUrl }: Props) {
	return (
		<div className="spelling-question-stage__stem">
			<div className="drill-prompt-card">
				{promptImageUrl ? (
					<ImageMcqPrompt promptImageUrl={promptImageUrl} />
				) : (
					<MeaningMcqPrompt prompt={prompt} />
				)}
			</div>
			{promptImageUrl ? (
				<p className="spelling-question-stage__meaning">{prompt}</p>
			) : null}
		</div>
	);
}

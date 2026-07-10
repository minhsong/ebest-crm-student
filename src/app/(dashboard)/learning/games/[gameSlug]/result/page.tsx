import { GameResultView } from '@/features/learning/games/result/GameResultView';
import { GameSlugSegmentPage } from '@/features/learning/games/session/GameSlugSegmentPage';

export default function GameResultPage() {
	return (
		<GameSlugSegmentPage urlSegment="result">
			<GameResultView />
		</GameSlugSegmentPage>
	);
}

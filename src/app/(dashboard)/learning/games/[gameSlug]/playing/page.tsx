import { GamePlayingView } from '@/features/learning/games/playing/GamePlayingView';
import { GameSlugSegmentPage } from '@/features/learning/games/session/GameSlugSegmentPage';

export default function GamePlayingPage() {
	return (
		<GameSlugSegmentPage urlSegment="playing">
			<GamePlayingView />
		</GameSlugSegmentPage>
	);
}

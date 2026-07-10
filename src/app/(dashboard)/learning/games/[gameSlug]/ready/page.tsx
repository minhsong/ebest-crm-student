import { GameReadyView } from '@/features/learning/games/ready/GameReadyView';
import { GameSlugSegmentPage } from '@/features/learning/games/session/GameSlugSegmentPage';

export default function GameReadyPage() {
	return (
		<GameSlugSegmentPage urlSegment="ready">
			<GameReadyView />
		</GameSlugSegmentPage>
	);
}

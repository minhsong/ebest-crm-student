import { redirect } from 'next/navigation';

import { resolveLegacyGamesRedirectHref } from '@/features/learning/games/session/legacy-games-redirect.utils';

type Props = {
	searchParams?: Record<string, string | string[] | undefined>;
};

/** @deprecated Dùng `/learning/games` hoặc slug route — redirect thẳng tới ready/playing khi có query. */
export default function LearningPracticeRedirectPage({ searchParams }: Props) {
	redirect(resolveLegacyGamesRedirectHref(searchParams));
}

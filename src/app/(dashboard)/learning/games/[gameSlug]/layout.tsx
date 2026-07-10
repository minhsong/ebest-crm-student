import { notFound } from 'next/navigation';

import { isValidGameSlug } from '@/features/learning/games/catalog/game-catalog.registry';

type Props = {
	children: React.ReactNode;
	params: { gameSlug: string };
};

/** B1 — validate slug một lần cho mọi segment ready/playing/result. */
export default function GameSlugLayout({ children, params }: Props) {
	if (!isValidGameSlug(params.gameSlug)) {
		notFound();
	}
	return children;
}

'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Modal, Skeleton } from 'antd';

import { getGameCatalogEntry } from '@/features/learning/games/catalog/game-catalog.registry';
import {
	GameRouteContextProvider,
} from '@/features/learning/games/session/game-route.context';
import { parseGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import { useGameRouteReconcile } from '@/features/learning/games/session/use-game-route-reconcile';
import type { GameUrlSegment } from '@/features/learning/games/session/game-route.utils';

export {
	useGameRouteContext,
	useGameSlug,
} from '@/features/learning/games/session/game-route.context';

type Props = {
	gameSlug: string;
	urlSegment: GameUrlSegment;
	children: React.ReactNode;
};

export function GameSlugRouteShell({ gameSlug, urlSegment, children }: Props) {
	const searchParams = useSearchParams();
	const routeQuery = useMemo(() => parseGameRouteQuery(searchParams), [searchParams]);
	const catalogEntry = getGameCatalogEntry(gameSlug);

	const {
		loading,
		play,
		confirmContinue,
		reconciled,
		handleContinuePlay,
		handleDismissContinue,
		handleAbandonAndStay,
	} = useGameRouteReconcile({
		gameSlug,
		urlSegment,
		routeQuery,
		catalogEntry,
	});

	if (!catalogEntry) {
		return null;
	}

	if (loading) {
		return (
			<div className="drill-page games-hub-page p-3">
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	return (
		<GameRouteContextProvider
			value={{ gameSlug, urlSegment, play, reconciled }}
		>
			<Modal
				open={confirmContinue}
				title="Lượt chơi chưa kết thúc"
				onOk={handleContinuePlay}
				closable
				onCancel={handleDismissContinue}
				maskClosable={false}
				footer={[
					<Button key="dismiss" onClick={handleDismissContinue}>
						Bỏ qua
					</Button>,
					<Button key="abandon" danger onClick={() => void handleAbandonAndStay()}>
						Kết thúc lượt
					</Button>,
					<Button key="continue" type="primary" onClick={handleContinuePlay}>
						Tiếp tục chơi
					</Button>,
				]}
			>
				Bạn có lượt chơi đang dở. Tiếp tục chơi hoặc kết thúc lượt để làm việc khác.
			</Modal>
			{children}
		</GameRouteContextProvider>
	);
}

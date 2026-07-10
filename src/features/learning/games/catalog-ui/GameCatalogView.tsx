'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SoundOutlined, TranslationOutlined, PictureOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningDashboardClassContextCard } from '@/features/learning/components/parts/LearningDashboardClassContextCard';
import {
	GAMES_WEEK_STAT_ITEMS,
	LearningWeekStatsPart,
} from '@/features/learning/components/parts/LearningWeekStatsPart';
import { GameCatalogCard } from '@/features/learning/games/catalog-ui/GameCatalogCard';
import { GameHubQuickActions } from '@/features/learning/games/catalog-ui/GameHubQuickActions';
import { useGamesHubWeekStats } from '@/features/learning/games/catalog-ui/use-games-hub-week-stats';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { GAME_CATALOG_ENTRIES } from '@/features/learning/games/catalog/game-catalog.registry';
import { resolveGameCatalogEligibility } from '@/features/learning/games/catalog/game-catalog-eligibility.utils';
import { buildGameReadyHref } from '@/features/learning/games/session/game-route.utils';
import { fetchVocabularyPool } from '@/lib/learning-api';
import type { VocabularyPoolPayload } from '@/types/learning';
import { Typography } from 'antd';

import '@/features/learning/games/catalog-ui/games-hub.css';
import '@/features/learning/components/drill/drill-survival.css';

const { Text } = Typography;

function catalogIcon(promptType: string) {
	if (promptType === 'audio_to_word') return <SoundOutlined />;
	if (promptType === 'image_to_word' || promptType === 'word_to_image') {
		return <PictureOutlined />;
	}
	return <TranslationOutlined />;
}

export function GameCatalogView() {
	const router = useRouter();
	const { selectedClassId, setSelectedClassId, selectedClass, data, hubLoading } = useLearningHub();
	const weekStats = useGamesHubWeekStats(data?.weekStats);

	const [poolMeta, setPoolMeta] = useState<VocabularyPoolPayload | null>(null);
	const [poolLoading, setPoolLoading] = useState(false);

	useEffect(() => {
		if (!selectedClassId) {
			setPoolMeta(null);
			return;
		}
		let cancelled = false;
		setPoolLoading(true);
		void fetchVocabularyPool(selectedClassId)
			.then((payload) => {
				if (!cancelled) setPoolMeta(payload);
			})
			.catch(() => {
				if (!cancelled) setPoolMeta(null);
			})
			.finally(() => {
				if (!cancelled) setPoolLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [selectedClassId]);

	return (
		<div className="games-hub-page drill-page">
			<PageHeader
				className="games-hub-page-header"
				title="Game luyện từ"
				description="Chọn dạng game — Survival, Speed run hoặc Best of…"
			/>

			<div className="games-hub-catalog games-hub-catalog--primary">
				{GAME_CATALOG_ENTRIES.map((entry) => {
					const eligibility = resolveGameCatalogEligibility(
						entry,
						selectedClassId ? poolMeta : null,
					);
					const disabled = !eligibility.eligible || poolLoading;

					return (
						<GameCatalogCard
							key={entry.slug}
							title={entry.title}
							description={entry.description}
							icon={catalogIcon(entry.promptType)}
							shipped={entry.shipped}
							disabled={disabled}
							disabledReason={eligibility.reason}
							onPlay={() => {
								if (!selectedClassId || disabled) return;
								router.push(
									buildGameReadyHref(entry.slug, {
										classId: selectedClassId,
										modeId: 'survival',
									}),
								);
							}}
						/>
					);
				})}
			</div>

			{!selectedClassId ? (
				<Text type="secondary" className="mt-3 block text-xs">
					Chọn lớp ở mục bên dưới để bắt đầu chơi.
				</Text>
			) : null}

			<section className="games-hub-secondary" aria-label="Thống kê và tiện ích">
				<h2 className="games-hub-secondary__title">Thống kê &amp; tiện ích</h2>

				<LearningDashboardClassContextCard
					hub={data}
					hubLoading={hubLoading}
					selectedClassId={selectedClassId}
					onClassChange={setSelectedClassId}
					selectedClass={selectedClass}
					label="Lớp cho game & BXH"
				/>

				<LearningWeekStatsPart
					title="Tuần này"
					loading={hubLoading}
					stats={weekStats}
					items={GAMES_WEEK_STAT_ITEMS}
					gridClassName="learning-dashboard-stats"
				/>

				<GameHubQuickActions classId={selectedClassId} />
			</section>
		</div>
	);
}

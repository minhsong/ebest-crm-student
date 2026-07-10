'use client';

import { useMemo } from 'react';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type {
	AssignmentDrillContextPayload,
	VocabularyPoolPayload,
	WeakWordsPayload,
} from '@/types/learning';
import { buildVocabularyDrillLobbyViewModel } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-lobby.mapper';
import { AssignmentLobbyHero } from '@/features/learning/games/vocabulary-drill/presentation/lobby/AssignmentLobbyHero';
import { FreePracticeLobbyHero } from '@/features/learning/games/vocabulary-drill/presentation/lobby/FreePracticeLobbyHero';
import { DrillLobbySharedPanels } from '@/features/learning/games/vocabulary-drill/presentation/lobby/DrillLobbySharedPanels';
import '@/features/learning/components/drill/drill-survival.css';

type Props = {
	pool: VocabularyPoolPayload | null;
	assignmentCtx: AssignmentDrillContextPayload | null;
	sessionConfig: GameSessionConfig | null;
	canStart: boolean;
	startBlockReason?: string | null;
	weakWords: WeakWordsPayload | null;
	weakWordsLoading: boolean;
	classId: number | null;
	onStart: () => void;
	onRefresh?: () => void;
};

export function DrillPracticeLobby({
	pool,
	assignmentCtx,
	sessionConfig,
	canStart,
	startBlockReason,
	weakWords,
	weakWordsLoading,
	classId,
	onStart,
	onRefresh,
}: Props) {
	const lobbyVm = useMemo(
		() =>
			buildVocabularyDrillLobbyViewModel({
				sessionConfig,
				assignmentCtx,
			}),
		[assignmentCtx, sessionConfig],
	);

	return (
		<div className="drill-lobby">
			{lobbyVm.showModePicker ? (
				<FreePracticeLobbyHero vm={lobbyVm} canStart={canStart} onStart={onStart} />
			) : (
				<AssignmentLobbyHero
					vm={lobbyVm}
					canStart={canStart}
					startBlockReason={startBlockReason}
					onStart={onStart}
				/>
			)}

			<DrillLobbySharedPanels
				pool={pool}
				weakWords={weakWords}
				weakWordsLoading={weakWordsLoading}
				classId={classId}
				showWeakWords={!assignmentCtx}
				showPoolSummary={!assignmentCtx}
				onRefresh={onRefresh}
			/>
		</div>
	);
}

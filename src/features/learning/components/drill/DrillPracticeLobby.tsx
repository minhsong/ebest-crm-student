'use client';



import { useMemo } from 'react';

import { Button, Skeleton } from 'antd';

import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';
import type { DrillPracticeSelection } from '@/features/learning/hooks/useDrillPracticePool';

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

	selection: DrillPracticeSelection;

	resolvedSelection: DrillPracticeSelection;

	onSelectionChange: (selection: DrillPracticeSelection) => void;

	pool: VocabularyPoolPayload | null;

	assignmentCtx: AssignmentDrillContextPayload | null;

	sessionConfig: GameSessionConfig | null;

	sessionConfigLoading?: boolean;

	canStart: boolean;

	startBlockReason?: string | null;

	weakWords: WeakWordsPayload | null;

	weakWordsLoading: boolean;

	classId: number | null;

	onStart: () => void;

	onRefresh?: () => void;

};



export function DrillPracticeLobby({

	selection,

	resolvedSelection,

	onSelectionChange,

	pool,

	assignmentCtx,

	sessionConfig,

	sessionConfigLoading = false,

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

	if (!lobbyVm) {
		return (
			<div className="drill-lobby">
				{sessionConfigLoading ? (
					<div className="drill-lobby-hero-skeleton">
						<Skeleton active paragraph={{ rows: 4 }} />
					</div>
				) : null}
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



	return (

		<div className="drill-lobby">

			{lobbyVm.showModePicker ? (

				<FreePracticeLobbyHero

					vm={lobbyVm}

					selection={selection}

					onSelectionChange={onSelectionChange}

					canStart={canStart}

					onStart={onStart}

				/>

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


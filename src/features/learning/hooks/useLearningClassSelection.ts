'use client';

import { useEffect, useState } from 'react';
import type { LearningHubClass, LearningHubPayload } from '@/types/learning';

function applyDefaultClassSelection(
	hub: LearningHubPayload,
	setSelectedClassId: (id: number | null) => void,
) {
	if (hub.classes?.length === 1) {
		setSelectedClassId(hub.classes[0].classId);
	} else if (hub.nearestSession?.classId ?? hub.todaySession?.classId) {
		setSelectedClassId(hub.nearestSession?.classId ?? hub.todaySession!.classId);
	} else if (hub.classes?.length) {
		const interactive = hub.classes.find((c) => c.interactionMode === 'interactive');
		setSelectedClassId(interactive?.classId ?? hub.classes[0].classId);
	}
}

/** State chọn lớp — đồng bộ default khi hub payload đổi. */
export function useLearningClassSelection(hub: LearningHubPayload | null) {
	const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

	useEffect(() => {
		if (!hub) {
			return;
		}
		applyDefaultClassSelection(hub, setSelectedClassId);
	}, [hub]);

	const selectedClass: LearningHubClass | null =
		hub?.classes?.find((c) => c.classId === selectedClassId) ?? null;

	return { selectedClassId, setSelectedClassId, selectedClass };
}

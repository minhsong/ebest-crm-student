'use client';



import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';

import { fetchLearningHub } from '@/lib/learning-api';

import {

	extractAssignmentsDue,

	type LearningAssignmentDue,

} from '@/lib/learning-assignments-due';

import type { LearningHubClass, LearningHubPayload } from '@/types/learning';

import type { OverviewClassSessions } from '@/types/overview-sessions';



const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';



export function useLearningHub() {

	const { fetchWithAuth } = useAuth();

	const [data, setData] = useState<LearningHubPayload | null>(null);

	const [assignmentsDue, setAssignmentsDue] = useState<LearningAssignmentDue[]>([]);

	const [loading, setLoading] = useState(true);

	const [error, setError] = useState<string | null>(null);

	const [selectedClassId, setSelectedClassId] = useState<number | null>(null);



	const load = useCallback(async () => {

		setLoading(true);

		setError(null);

		try {

			const [hub, overviewRes] = await Promise.all([

				fetchLearningHub(),

				fetchWithAuth(OVERVIEW_SESSIONS_PATH).catch(() => null),

			]);



			let due: LearningAssignmentDue[] = [];

			if (overviewRes?.ok) {

				const overviewData = (await overviewRes.json().catch(() => [])) as unknown;

				const blocks = Array.isArray(overviewData)

					? (overviewData as OverviewClassSessions[])

					: [];

				due = extractAssignmentsDue(blocks);

			}



			setData({ ...hub, assignmentsDue: due });

			setAssignmentsDue(due);



			if (hub.classes?.length === 1) {

				setSelectedClassId(hub.classes[0].classId);

			} else if (hub.nearestSession?.classId ?? hub.todaySession?.classId) {

				setSelectedClassId(
					hub.nearestSession?.classId ?? hub.todaySession!.classId,
				);

			} else if (hub.classes?.length) {
				const interactive = hub.classes.find(
					(c) => c.interactionMode === 'interactive',
				);
				setSelectedClassId(
					interactive?.classId ?? hub.classes[0].classId,
				);
			}

		} catch (e) {

			setData(null);

			setAssignmentsDue([]);

			setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');

		} finally {

			setLoading(false);

		}

	}, [fetchWithAuth]);



	useEffect(() => {

		void load();

	}, [load]);



	const selectedClass: LearningHubClass | null =

		data?.classes?.find((c) => c.classId === selectedClassId) ?? null;



	return {

		data,

		assignmentsDue,

		loading,

		error,

		refresh: load,

		selectedClassId,

		setSelectedClassId,

		selectedClass,

	};

}



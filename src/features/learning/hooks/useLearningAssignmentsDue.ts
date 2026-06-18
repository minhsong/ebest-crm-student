'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
	extractAssignmentsDue,
	type LearningAssignmentDue,
} from '@/lib/learning-assignments-due';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

/** Bài tập sắp hạn — tải độc lập (lazy) sau hub. */
export function useLearningAssignmentsDue(enabled = true) {
	const { fetchWithAuth } = useAuth();
	const [assignmentsDue, setAssignmentsDue] = useState<LearningAssignmentDue[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!enabled) {
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const overviewRes = await fetchWithAuth(OVERVIEW_SESSIONS_PATH).catch(() => null);
			if (!overviewRes?.ok) {
				setAssignmentsDue([]);
				return;
			}
			const overviewData = (await overviewRes.json().catch(() => [])) as unknown;
			const blocks = Array.isArray(overviewData)
				? (overviewData as OverviewClassSessions[])
				: [];
			setAssignmentsDue(extractAssignmentsDue(blocks));
		} catch (e) {
			setAssignmentsDue([]);
			setError(e instanceof Error ? e.message : 'Không tải được bài sắp hạn.');
		} finally {
			setLoading(false);
		}
	}, [enabled, fetchWithAuth]);

	useEffect(() => {
		void load();
	}, [load]);

	return { assignmentsDue, loading, error, refresh: load };
}

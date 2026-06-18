'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchLearningHub } from '@/lib/learning-api';
import type { LearningHubPayload } from '@/types/learning';

/** Hub CRM — lớp, buổi gần nhất, thống kê tuần (không gồm overview assignments). */
export function useLearningHubCore() {
	const [data, setData] = useState<LearningHubPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const hub = await fetchLearningHub();
			setData(hub);
		} catch (e) {
			setData(null);
			setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	return { data, loading, error, refresh: load };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';

import { abandonDrillSession, fetchActiveDrillPlay, isDrillPlayId } from '@/lib/learning-api';
import type { DrillActivePlayPayload } from '@/lib/learning-api';

export function useActiveDrillPlay(classId: number | null, promptType: string | null) {
	const [activePlay, setActivePlay] = useState<DrillActivePlayPayload | null>(null);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (!classId || !promptType) {
			setActivePlay(null);
			return;
		}
		setLoading(true);
		try {
			const play = await fetchActiveDrillPlay(classId, promptType);
			setActivePlay(play);
		} finally {
			setLoading(false);
		}
	}, [classId, promptType]);

	useEffect(() => {
		if (!classId || !promptType) {
			setActivePlay(null);
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);
		void fetchActiveDrillPlay(classId, promptType)
			.then((play) => {
				if (!cancelled) setActivePlay(play);
			})
			.catch(() => {
				if (!cancelled) setActivePlay(null);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [classId, promptType]);

	const abandonActive = useCallback(async () => {
		if (!activePlay?.playId || !isDrillPlayId(activePlay.playId)) {
			setActivePlay(null);
			return;
		}
		try {
			await abandonDrillSession(activePlay.playId, { treatNotFoundAsSuccess: true });
			setActivePlay(null);
			message.success('Đã kết thúc lượt chơi.');
		} catch {
			message.error('Không kết thúc được lượt chơi. Vui lòng thử lại.');
			await refresh();
		}
	}, [activePlay, refresh]);

	return { activePlay, activeLoading: loading, refreshActivePlay: refresh, abandonActive };
}

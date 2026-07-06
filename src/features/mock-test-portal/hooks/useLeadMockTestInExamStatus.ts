'use client';

import { useEffect, useState } from 'react';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

/** Trạng thái bài thi `in_exam` — lead portal cookie. */
export function useLeadMockTestInExamStatus(enabled: boolean) {
	const [status, setStatus] = useState<MockTestOnlineAttemptStatus | null>(null);
	const [loading, setLoading] = useState(enabled);

	useEffect(() => {
		if (!enabled) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		void (async () => {
			try {
				const qs = new URLSearchParams({
					testTypeCode: MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
				});
				const res = await fetch(
					`/api/public/mock-test-online/attempt-status?${qs.toString()}`,
					{ credentials: 'include', cache: 'no-store' },
				);
				if (!res.ok) {
					if (!cancelled) setStatus(null);
					return;
				}
				const data = (await res.json()) as MockTestOnlineAttemptStatus;
				if (!cancelled) setStatus(data);
			} catch {
				if (!cancelled) setStatus(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [enabled]);

	return { status, loading };
}

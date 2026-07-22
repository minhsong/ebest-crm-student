'use client';

import { useEffect, useState } from 'react';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

/** Trạng thái bài thi `in_exam` — hỗ trợ cả lead và customer portal cookie. */
export function usePortalMockTestInExamStatus(enabled: boolean) {
	const [status, setStatus] = useState<MockTestOnlineAttemptStatus | null>(null);
	const [loading, setLoading] = useState(enabled);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!enabled) {
			setLoading(false);
			setError(null);
			return;
		}
		let cancelled = false;
		void (async () => {
			try {
				setError(null);
				const qs = new URLSearchParams({
					testTypeCode: MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
				});
				const res = await fetch(
					`/api/public/mock-test-online/attempt-status?${qs.toString()}`,
					{ credentials: 'include', cache: 'no-store' },
				);
				if (!res.ok) {
					if (!cancelled) {
						setStatus(null);
						setError(
							'Không tải được trạng thái bài thi đang làm. Bạn vẫn xem được lịch sử; thử tải lại trang nếu cần tiếp tục bài dở.',
						);
					}
					return;
				}
				const data = (await res.json()) as MockTestOnlineAttemptStatus;
				if (!cancelled) {
					setStatus(data);
					setError(null);
				}
			} catch {
				if (!cancelled) {
					setStatus(null);
					setError(
						'Không kết nối được để kiểm tra bài thi đang làm. Vui lòng thử lại sau.',
					);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [enabled]);

	return { status, loading, error };
}

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Typography } from 'antd';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { resolveMockTestOnlineEntryHref } from '@/lib/public-mock-test-online/exam-entry.client';

const { Text } = Typography;

export function MockTestOnlineEntryClient() {
	const router = useRouter();
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		void (async () => {
			const href = await resolveMockTestOnlineEntryHref();
			router.replace(href);
		})();
	}, [router]);

	return (
		<MockTestOnlineFunnelShell step="register">
			<div className="flex flex-col items-center justify-center py-16">
				<Spin size="large" />
				<Text type="secondary" className="mt-4">
					Đang chuyển hướng…
				</Text>
			</div>
		</MockTestOnlineFunnelShell>
	);
}

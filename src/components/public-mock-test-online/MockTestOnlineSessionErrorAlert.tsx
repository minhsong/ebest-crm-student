'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Space } from 'antd';
import { clearMockTestOnlineSelectExamCache } from '@/lib/public-mock-test-online/exam-flow.util';
import {
	getMockTestOnlineRecoveryHref,
	type MockTestOnlineFunnelStep,
} from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';
import { resolveMockTestOnlineErrorCopy } from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';

type Props = {
	message: string;
	step: MockTestOnlineFunnelStep;
};

export function MockTestOnlineSessionErrorAlert({ message, step }: Props) {
	const router = useRouter();
	const { title, description } = resolveMockTestOnlineErrorCopy({ message, step });

	const handleRestart = () => {
		clearMockTestOnlineSelectExamCache();
		router.push(getMockTestOnlineRecoveryHref());
	};

	return (
		<Alert
			type="error"
			showIcon
			message={title}
			description={
				<Space direction="vertical" size="middle" className="w-full">
					<span>{description}</span>
					<Button type="primary" onClick={handleRestart}>
						Bắt đầu lại
					</Button>
				</Space>
			}
		/>
	);
}

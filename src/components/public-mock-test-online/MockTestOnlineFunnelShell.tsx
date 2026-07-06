'use client';

import type { ReactNode } from 'react';
import { Steps, Typography } from 'antd';
import {
	MOCK_TEST_ONLINE_FUNNEL_STEPS,
	mockTestOnlineFunnelStepIndex,
	type MockTestOnlineFunnelUiStep,
} from '@/lib/public-mock-test-online/mock-test-online-funnel.util';

const { Text } = Typography;

type Props = {
	step: MockTestOnlineFunnelUiStep;
	children: ReactNode;
	/** Ẩn tiến trình trên màn làm bài full-screen */
	showProgress?: boolean;
	/** Mở rộng layout khi làm bài */
	wide?: boolean;
};

export function MockTestOnlineFunnelShell({
	step,
	children,
	showProgress = true,
	wide = false,
}: Props) {
	const current = mockTestOnlineFunnelStepIndex(step);

	return (
		<div
			className={`mock-test-online-funnel-root${wide ? ' mock-test-online-funnel-root--wide' : ''}`}
		>
			{showProgress ? (
				<div className="mock-test-online-funnel-progress">
					<Text type="secondary" className="mock-test-online-funnel-kicker">
						Thi thử online Ebest
					</Text>
					<Steps
						size="small"
						current={current}
						className="mock-test-online-steps"
						items={MOCK_TEST_ONLINE_FUNNEL_STEPS.map((s) => ({
							title: s.title,
						}))}
						responsive
					/>
				</div>
			) : null}
			<div className="ebest-mock-test-widget mock-test-online-funnel-body">
				{children}
			</div>
		</div>
	);
}

import { Suspense } from 'react';

import { MockTestOnlineExamQuizClient } from '@/components/public-mock-test-online/MockTestOnlineExamQuizClient';



export default function MockTestOnlineExamRunPage() {

	return (

		<Suspense
			fallback={
				<div className="mock-test-online-funnel-root mock-test-online-funnel-root--wide">
					<div className="ebest-mock-test-widget py-16 text-center">Đang tải…</div>
				</div>
			}
		>

			<MockTestOnlineExamQuizClient entry="session" />

		</Suspense>

	);

}


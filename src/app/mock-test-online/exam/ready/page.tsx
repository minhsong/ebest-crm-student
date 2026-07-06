import { Suspense } from 'react';

import { MockTestOnlineExamQuizClient } from '@/components/public-mock-test-online/MockTestOnlineExamQuizClient';

import { buildPageMetadata } from '@/lib/metadata';



export const dynamic = 'force-dynamic';



export const metadata = buildPageMetadata({

	title: 'Phòng chờ — thi thử online Ebest',

	description: 'Xem hướng dẫn và bắt đầu làm bài thi thử online.',

	path: '/mock-test-online/exam/ready',

});



export default function MockTestOnlineExamReadyPage() {

	return (

		<Suspense
			fallback={
				<div className="mock-test-online-funnel-root">
					<div className="ebest-mock-test-widget py-16 text-center">Đang tải…</div>
				</div>
			}
		>

			<MockTestOnlineExamQuizClient entry="lobby" />

		</Suspense>

	);

}


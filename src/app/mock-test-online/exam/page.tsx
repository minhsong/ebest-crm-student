import { Suspense } from 'react';

import { MockTestOnlineExamLegacyRedirect } from '@/components/public-mock-test-online/MockTestOnlineExamLegacyRedirect';

import { buildPageMetadata } from '@/lib/metadata';



export const dynamic = 'force-dynamic';



export const metadata = buildPageMetadata({

	title: 'Nhập mã làm bài thi thử online',

	description: 'Chuyển hướng tới trang xác nhận bài thi thử online Ebest.',

	path: '/mock-test-online/exam',

});



/** @deprecated Dùng `/mock-test-online/confirm-exam` — route giữ redirect tương thích. */

export default function MockTestOnlineExamPage() {

	return (

		<Suspense fallback={<div className="ebest-mock-test-widget m-4">Đang tải…</div>}>

			<MockTestOnlineExamLegacyRedirect />

		</Suspense>

	);

}


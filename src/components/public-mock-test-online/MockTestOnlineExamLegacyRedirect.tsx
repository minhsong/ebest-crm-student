'use client';



import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Spin, Typography } from 'antd';

import { buildMockTestOnlineConfirmExamPath } from '@/lib/public-mock-test-online/select-exam-cache';

import { fetchMockTestOnlineConfirmSession } from '@/lib/public-mock-test-online/mock-test-online-api.client';



const { Text } = Typography;



/**

 * Legacy `/mock-test-online/exam` — redirect sang confirm-exam (canonical unlock UI).

 * @deprecated Route giữ để tương thích link Zalo cũ; UI unlock gom tại confirm-exam.

 */

export function MockTestOnlineExamLegacyRedirect() {

	const router = useRouter();

	const searchParams = useSearchParams();



	useEffect(() => {

		let cancelled = false;



		const pending = searchParams.get('pending')?.trim() ?? '';

		const registrationRaw = searchParams.get('registration')?.trim() ?? '';

		const registrationId =

			registrationRaw && /^\d+$/.test(registrationRaw)

				? Number(registrationRaw)

				: undefined;



		if (!pending) {

			router.replace('/mock-test-online/register');

			return;

		}



		void (async () => {

			try {

				const data = await fetchMockTestOnlineConfirmSession(pending);

				if (cancelled) return;

				const path = buildMockTestOnlineConfirmExamPath({

					pendingRegistrationId: pending,

					pendingLeadId: data.pendingLeadId,

					sessionId: data.sessionId,

					registrationId: registrationId ?? data.registrationId ?? undefined,

				});

				router.replace(path);

			} catch {

				if (cancelled) return;

				router.replace(

					buildMockTestOnlineConfirmExamPath({

						pendingRegistrationId: pending,

						registrationId,

					}),

				);

			}

		})();



		return () => {

			cancelled = true;

		};

	}, [router, searchParams]);



	return (

		<div className="ebest-mock-test-widget flex flex-col items-center gap-3 py-12">

			<Spin />

			<Text type="secondary">Đang chuyển tới trang xác nhận bài thi…</Text>

		</div>

	);

}


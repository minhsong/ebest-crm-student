'use client';



import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { ensureMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';

import {

	isMockTestOnlineExamSessionReady,

	type MockTestOnlineExamAuth,

} from '@/lib/public-mock-test-online/exam-session';



type GateResult = {

	auth: MockTestOnlineExamAuth | null;

	loading: boolean;

};



export function useMockTestOnlineExamGate(

	fallbackPath = '/mock-test-online/register',

): GateResult {

	const router = useRouter();

	const searchParams = useSearchParams();

	const [auth, setAuth] = useState<MockTestOnlineExamAuth | null>(null);

	const [loading, setLoading] = useState(true);



	const registrationIdFromUrl = (() => {

		const raw = searchParams.get('registrationId');

		if (!raw) return undefined;

		const n = Number(raw);

		return Number.isFinite(n) && n >= 1 ? n : undefined;

	})();



	const formPublicIdFromUrl = searchParams.get('form')?.trim() || undefined;



	useEffect(() => {

		let cancelled = false;

		(async () => {

			const session = await ensureMockTestOnlineExamAuth(registrationIdFromUrl);

			if (cancelled) return;

			const ready =

				session &&

				isMockTestOnlineExamSessionReady(session) &&

				(!formPublicIdFromUrl ||

					session.formPublicId?.trim() === formPublicIdFromUrl);

			if (!ready) {

				setLoading(false);

				router.replace(fallbackPath);

				return;

			}

			setAuth(session);

			setLoading(false);

		})();

		return () => {

			cancelled = true;

		};

	}, [fallbackPath, formPublicIdFromUrl, registrationIdFromUrl, router]);



	return { auth, loading };

}


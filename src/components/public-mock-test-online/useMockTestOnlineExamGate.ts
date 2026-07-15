'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ensureMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';
import {
	isMockTestOnlineExamSessionReady,
	type MockTestOnlineExamAuth,
} from '@/lib/public-mock-test-online/exam-session';

export type MockTestOnlineExamGateFailure = {
	kind: 'session_expired' | 'form_mismatch';
	title: string;
	description: string;
};

type GateResult = {
	auth: MockTestOnlineExamAuth | null;
	loading: boolean;
	gateFailure: MockTestOnlineExamGateFailure | null;
};

/**
 * Kiểm tra phiên vào thi trước lobby/run.
 * Không redirect im lặng — caller hiện Alert + CTA (góc nhìn người dùng).
 */
export function useMockTestOnlineExamGate(): GateResult {
	const searchParams = useSearchParams();
	const [auth, setAuth] = useState<MockTestOnlineExamAuth | null>(null);
	const [loading, setLoading] = useState(true);
	const [gateFailure, setGateFailure] =
		useState<MockTestOnlineExamGateFailure | null>(null);

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

			if (!session || !isMockTestOnlineExamSessionReady(session)) {
				setAuth(null);
				setGateFailure({
					kind: 'session_expired',
					title: 'Phiên làm bài đã hết hạn',
					description:
						'Bạn cần xác nhận lại để vào phòng thi. Nếu còn bài đang làm dở, hãy tiếp tục từ trang đăng ký hoặc lịch sử thi.',
				});
				setLoading(false);
				return;
			}

			if (
				formPublicIdFromUrl &&
				session.formPublicId?.trim() !== formPublicIdFromUrl
			) {
				setAuth(null);
				setGateFailure({
					kind: 'form_mismatch',
					title: 'Bài thi không khớp',
					description:
						'Liên kết mở không đúng bài thi bạn đã chọn. Hãy quay lại chọn bài thi hoặc tiếp tục từ đúng liên kết.',
				});
				setLoading(false);
				return;
			}

			setGateFailure(null);
			setAuth(session);
			setLoading(false);
		})();

		return () => {
			cancelled = true;
		};
	}, [formPublicIdFromUrl, registrationIdFromUrl]);

	return { auth, loading, gateFailure };
}

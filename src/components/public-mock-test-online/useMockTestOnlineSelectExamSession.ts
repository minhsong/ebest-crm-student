'use client';

import { useEffect, useState } from 'react';
import {
	hasActiveExamSessionToken,
	parseZaloConfirmMessage,
	readSelectExamCache,
	readSelectExamCacheByPending,
	writeSelectExamCache,
	type CachedSelectExamResult,
} from '@/lib/public-mock-test-online/exam-flow.util';
import { fetchMockTestOnlineConfirmSession } from '@/lib/public-mock-test-online/mock-test-online-api.client';

type Args = {
	pendingLeadId?: string;
	sessionId: number;
	pendingRegistrationId?: string | null;
	variant?: 'full' | 'mini';
	campaignTitle?: string;
};

type Result = {
	examSession: CachedSelectExamResult | null;
	loading: boolean;
	error: string | null;
};

function hasZaloConfirmPayload(cached: CachedSelectExamResult): boolean {
	if (cached.zaloConfirmMessage?.trim()) return true;
	const fromDeepLink = cached.zaloDeepLink?.trim()
		? parseZaloConfirmMessage(cached.zaloDeepLink)
		: '';
	return Boolean(fromDeepLink.trim());
}

function mapSelectExamToCache(
	leadId: string,
	data: Awaited<ReturnType<typeof fetchMockTestOnlineConfirmSession>>,
	variant: 'full' | 'mini' | undefined,
	campaignTitle?: string,
): CachedSelectExamResult {
	return {
		pendingLeadId: leadId || data.pendingLeadId,
		sessionId: data.sessionId,
		testVariantChoice: variant,
		pendingRegistrationId: data.pendingRegistrationId,
		registrationId: data.registrationId ?? null,
		zaloDeepLink: data.zaloDeepLink ?? '',
		zaloOaChatUrl:
			data.zaloOaChatUrl ||
			(data.zaloOaId ? `https://zalo.me/${data.zaloOaId}` : ''),
		zaloOaId: data.zaloOaId,
		zaloConfirmMessage: data.zaloConfirmMessage,
		zaloConfirmExpiresAt:
			data.zaloConfirmExpiresAt ?? data.examSessionExpiresAt ?? '',
		examSessionToken: data.examSessionToken,
		examSessionExpiresAt: data.examSessionExpiresAt,
		campaignTitle,
		verificationChannel: data.verificationChannel,
		nextStep: data.nextStep,
	};
}

export function useMockTestOnlineSelectExamSession({
	pendingLeadId = '',
	sessionId,
	pendingRegistrationId,
	variant,
	campaignTitle,
}: Args): Result {
	const [examSession, setExamSession] = useState<CachedSelectExamResult | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const leadId = pendingLeadId.trim();
		const pendingId = pendingRegistrationId?.trim() ?? '';
		const hasSessionId = Number.isFinite(sessionId) && sessionId >= 1;

		if (!hasSessionId && !pendingId) {
			setExamSession(null);
			setError('Thiếu thông tin bài thi. Vui lòng chọn lại.');
			setLoading(false);
			return;
		}

		if (!leadId && !pendingId) {
			setExamSession(null);
			setError('Thiếu thông tin bài thi. Vui lòng chọn lại.');
			setLoading(false);
			return;
		}

		setError(null);

		const cached = hasSessionId
			? leadId
				? readSelectExamCache(leadId, sessionId)
				: readSelectExamCacheByPending(pendingId, sessionId)
			: null;

		const recoverPendingId =
			pendingId || cached?.pendingRegistrationId?.trim() || '';

		if (!recoverPendingId) {
			setExamSession(null);
			setError(
				'Phiên làm bài không còn hoặc liên kết không đầy đủ. Vui lòng bắt đầu lại từ trang thi thử online.',
			);
			setLoading(false);
			return;
		}

		// Cache thiếu mã Zalo (pending email legacy) → không early-return.
		if (
			cached &&
			hasActiveExamSessionToken(cached) &&
			hasZaloConfirmPayload(cached)
		) {
			setExamSession(cached);
			setLoading(false);
			return;
		}

		if (cached && hasZaloConfirmPayload(cached)) {
			setExamSession(cached);
			setLoading(false);
		} else {
			setLoading(true);
		}

		let cancelled = false;

		void (async () => {
			try {
				const data = await fetchMockTestOnlineConfirmSession(recoverPendingId);
				if (cancelled) return;

				const result = mapSelectExamToCache(
					leadId || data.pendingLeadId,
					data,
					variant,
					campaignTitle,
				);
				if (!hasZaloConfirmPayload(result)) {
					setExamSession(null);
					setError(
						'Thiếu mã xác minh Zalo (phiên cũ). Vui lòng chọn lại bài thi để nhận mã mới.',
					);
					return;
				}
				writeSelectExamCache(result);
				setExamSession(result);
				setError(null);
			} catch (e) {
				if (!cancelled && !(cached && hasZaloConfirmPayload(cached))) {
					setExamSession(null);
					setError(
						e instanceof Error
							? e.message
							: 'Không khởi tạo được phiên bài thi.',
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [campaignTitle, pendingLeadId, pendingRegistrationId, sessionId, variant]);

	return { examSession, loading, error };
}

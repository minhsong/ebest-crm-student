'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { applyMockTestOnlineAuthorizeResponse } from '@/lib/public-mock-test-online/mock-test-online-authorize-persist.client';
import {
	clearMockTestOnlineExamAuth,
	loadMockTestOnlineExamAuth,
} from '@/lib/public-mock-test-online/exam-session';
import {
	fetchMockTestOnlineConfirmSession,
	postMockTestOnlineAuthorize,
	postMockTestOnlineVerifyUnlockCode,
} from '@/lib/public-mock-test-online/mock-test-online-api.client';
import type { CachedSelectExamResult } from '@/lib/public-mock-test-online/exam-flow.util';
import {
	patchSelectExamCache,
	readAnyActiveExamSessionToken,
} from '@/lib/public-mock-test-online/exam-flow.util';
import {
	isValidMockTestUnlockCode,
	normalizeMockTestUnlockCode,
} from '@/lib/public-mock-test-online/unlock-code.util';
import { mockTestOnlineToastMessage } from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';

async function resolveExamSessionToken(
	examSession: CachedSelectExamResult,
): Promise<string | null> {
	const fromSession = examSession.examSessionToken?.trim();
	if (fromSession) return fromSession;

	const fromStore = readAnyActiveExamSessionToken();
	if (fromStore) return fromStore;

	const pendingId = examSession.pendingRegistrationId?.trim();
	if (!pendingId) return null;

	try {
		const data = await fetchMockTestOnlineConfirmSession(pendingId);
		const token = data.examSessionToken?.trim();
		const expiresAt = data.examSessionExpiresAt?.trim();
		if (token && expiresAt) {
			patchSelectExamCache({
				pendingRegistrationId: pendingId,
				examSessionToken: token,
				examSessionExpiresAt: expiresAt,
			});
			return token;
		}
	} catch {
		// fallback — caller xử lý thiếu token
	}

	return null;
}

export function useMockTestOnlineExamAuthorize() {
	const router = useRouter();
	const { message } = App.useApp();
	const [autoProceeding, setAutoProceeding] = useState(false);
	const [submittingUnlock, setSubmittingUnlock] = useState(false);
	const autoProceedRef = useRef(false);

	const navigateToReady = useCallback(() => {
		router.push('/mock-test-online/exam/ready');
	}, [router]);

	const saveAuthorizeAndNavigate = useCallback(
		async (
			authData: Awaited<ReturnType<typeof postMockTestOnlineAuthorize>>,
			examSessionToken?: string,
		) => {
			const prev = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
			clearMockTestOnlineExamAuth();
			applyMockTestOnlineAuthorizeResponse(prev, authData, {
				examSessionToken,
				keepAttemptPublicIdOnSameForm: false,
			});
			message.success('Xác minh thành công. Đang chuyển tới bài thi…');
			navigateToReady();
		},
		[message, navigateToReady],
	);

	const proceedWithSessionToken = useCallback(
		async (
			examSession: CachedSelectExamResult,
			registrationId: number,
			opts?: { manual?: boolean },
		) => {
			if (!opts?.manual && autoProceedRef.current) return;

			const sessionToken = await resolveExamSessionToken(examSession);
			if (!sessionToken) {
				if (!opts?.manual) {
					message.warning(
						'Đã xác minh Zalo nhưng thiếu phiên làm bài. Bấm «Tiếp tục làm bài» hoặc nhập mã từ Zalo.',
					);
				}
				return;
			}

			if (!opts?.manual) {
				autoProceedRef.current = true;
			}
			setAutoProceeding(true);
			try {
				const authData = await postMockTestOnlineAuthorize({
					examSessionToken: sessionToken,
					registrationId,
					pendingRegistrationId: examSession.pendingRegistrationId,
					intent: 'access',
				});
				await saveAuthorizeAndNavigate(authData, sessionToken);
			} catch (e) {
				autoProceedRef.current = false;
				if (opts?.manual) {
					message.error(
						mockTestOnlineToastMessage(
							e,
							'b2c_confirm_zalo',
							'Không vào được phòng làm bài. Thử lại hoặc nhập mã từ Zalo.',
						),
					);
				} else {
					message.warning(
						mockTestOnlineToastMessage(
							e,
							'b2c_confirm_zalo',
							'Không tự mở khóa được. Bấm «Tiếp tục làm bài» hoặc nhập mã từ Zalo.',
						),
					);
				}
			} finally {
				setAutoProceeding(false);
			}
		},
		[message, saveAuthorizeAndNavigate],
	);

	const proceedAfterZaloVerified = useCallback(
		(examSession: CachedSelectExamResult, registrationId: number) => {
			void proceedWithSessionToken(examSession, registrationId, { manual: true });
		},
		[proceedWithSessionToken],
	);

	const proceedWithUnlockCode = useCallback(
		async (
			examSession: CachedSelectExamResult,
			code: string,
			registrationId: number | null | undefined,
		) => {
			const normalized = normalizeMockTestUnlockCode(code);
			if (!isValidMockTestUnlockCode(normalized)) {
				message.error('Vui lòng nhập mã 6 ký tự từ Zalo.');
				return;
			}

			setSubmittingUnlock(true);
			try {
				const verifyBody: Record<string, unknown> = { examUnlockCode: normalized };
				if (registrationId) {
					verifyBody.registrationId = registrationId;
				} else {
					verifyBody.pendingRegistrationId = examSession.pendingRegistrationId;
				}

				const verifyData = await postMockTestOnlineVerifyUnlockCode(verifyBody);
				const authData = await postMockTestOnlineAuthorize({
					registrationId: verifyData.registrationId,
					examUnlockCode: normalized,
					intent: 'access',
				});
				const prev = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
				clearMockTestOnlineExamAuth();
				applyMockTestOnlineAuthorizeResponse(prev, authData, {
					examSessionToken: examSession.examSessionToken?.trim() || undefined,
					keepAttemptPublicIdOnSameForm: false,
				});
				message.success('Mã hợp lệ. Xem hướng dẫn và bắt đầu làm bài.');
				navigateToReady();
			} catch (e) {
				message.error(
					mockTestOnlineToastMessage(e, 'b2c_confirm_zalo', 'Không xác minh được mã.'),
				);
			} finally {
				setSubmittingUnlock(false);
			}
		},
		[message, navigateToReady],
	);

	return {
		autoProceeding,
		submittingUnlock,
		proceedWithSessionToken,
		proceedAfterZaloVerified,
		proceedWithUnlockCode,
	};
}

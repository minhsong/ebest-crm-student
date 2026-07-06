'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { patchSelectExamCache } from '@/lib/public-mock-test-online/exam-flow.util';
import {
	fetchMockTestOnlinePendingStatus,
	provisionLeadPortalSession,
} from '@/lib/public-mock-test-online/mock-test-online-api.client';
import {
	MOCK_TEST_ONLINE_WS,
	connectMockTestOnlineSocket,
	isMockTestOnlineWsConfigured,
	type MockTestOnlineUnlockReadyEvent,
} from '@/lib/public-mock-test-online/mock-test-online-ws-client';
import {
	isMockTestOnlineZaloVerified,
	pollStatusFromUnlockReadyEvent,
} from '@/lib/public-mock-test-online/mock-test-online-zalo-verify.util';
import type { MockTestOnlinePollStatus } from '@/lib/public-mock-test-online/types';
import { mtoClientDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';
import { MockTestOnlineApiError } from '@/lib/public-mock-test-online/mock-test-online-api-error';

const POLL_INTERVAL_MS = 3000;
const POLL_ERROR_INTERVAL_MS = 5000;
const POLL_RATE_LIMIT_INTERVAL_MS = 60_000;
const WS_CONNECT_FALLBACK_MS = 8000;

export type MockTestOnlineZaloVerifyTransport = 'ws' | 'poll' | 'idle';

type Args = {
	pendingRegistrationId: string | null | undefined;
	examSessionToken: string | null | undefined;
	enabled: boolean;
	onUnlockReady: (registrationId: number) => void;
};

type Result = {
	status: MockTestOnlinePollStatus | null;
	zaloVerified: boolean;
	transport: MockTestOnlineZaloVerifyTransport;
	wsConnected: boolean;
	error: string | null;
};

export function useMockTestOnlineZaloVerifySession({
	pendingRegistrationId,
	examSessionToken,
	enabled,
	onUnlockReady,
}: Args): Result {
	const [status, setStatus] = useState<MockTestOnlinePollStatus | null>(null);
	const [zaloVerified, setZaloVerified] = useState(false);
	const [transport, setTransport] = useState<MockTestOnlineZaloVerifyTransport>('idle');
	const [wsConnected, setWsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onUnlockReadyRef = useRef(onUnlockReady);
	onUnlockReadyRef.current = onUnlockReady;
	const unlockHandledRef = useRef(false);
	const leadSessionProvisionedRef = useRef(false);

	const maybeProvisionLeadSession = useCallback(
		(status: MockTestOnlinePollStatus) => {
			const registrationId = status.registrationId;
			const pendingId = pendingRegistrationId?.trim();
			if (registrationId && registrationId >= 1) {
				if (leadSessionProvisionedRef.current) return;
				leadSessionProvisionedRef.current = true;
				void provisionLeadPortalSession({ registrationId }).catch((e) => {
					leadSessionProvisionedRef.current = false;
					mtoClientDebug('provision.lead_session.failed', {
						registrationId,
						message: e instanceof Error ? e.message : String(e),
					});
				});
				return;
			}
			if (isMockTestOnlineZaloVerified(status) && pendingId) {
				if (leadSessionProvisionedRef.current) return;
				leadSessionProvisionedRef.current = true;
				void provisionLeadPortalSession({ pendingRegistrationId: pendingId }).catch(
					(e) => {
						leadSessionProvisionedRef.current = false;
						mtoClientDebug('provision.lead_session.pending_failed', {
							pendingRegistrationId: pendingId,
							message: e instanceof Error ? e.message : String(e),
						});
					},
				);
			}
		},
		[pendingRegistrationId],
	);

	/** `ready` = verified + registrationId — có thể auto-proceed; `verified` = chờ sync CRM. */
	const applyStatus = useCallback((next: MockTestOnlinePollStatus): 'ready' | 'verified' | 'pending' => {
		setStatus(next);
		const verified = isMockTestOnlineZaloVerified(next);
		setZaloVerified(verified);
		if (verified) {
			maybeProvisionLeadSession(next);
		}
		if (verified && next.registrationId && next.registrationId >= 1) {
			if (!unlockHandledRef.current) {
				unlockHandledRef.current = true;
				onUnlockReadyRef.current(next.registrationId);
			}
			return 'ready';
		}
		if (verified) return 'verified';
		return 'pending';
	}, [maybeProvisionLeadSession]);

	useEffect(() => {
		if (!enabled || !pendingRegistrationId?.trim()) {
			return;
		}

		const pendingId = pendingRegistrationId.trim();
		let cancelled = false;
		let pollTimer: ReturnType<typeof setTimeout> | null = null;
		let wsFallbackTimer: ReturnType<typeof setTimeout> | null = null;
		let socket: Socket | null = null;
		let pollLoopActive = false;
		let syncPollActive = false;
		let localWsConnected = false;

		const clearPollTimer = () => {
			if (pollTimer) clearTimeout(pollTimer);
			pollTimer = null;
		};

		const stopPollLoop = () => {
			pollLoopActive = false;
			syncPollActive = false;
			clearPollTimer();
		};

		const schedulePoll = (delayMs: number) => {
			if (cancelled || !pollLoopActive) return;
			if (localWsConnected && !syncPollActive) return;
			clearPollTimer();
			pollTimer = setTimeout(() => void runPoll(), delayMs);
		};

		const runPoll = async () => {
			if (cancelled || !pollLoopActive) return;
			if (localWsConnected && !syncPollActive) return;
			try {
				const data = await fetchMockTestOnlinePendingStatus(pendingId);
				if (cancelled) return;
				setError(null);
				mtoClientDebug('poll.status', {
					pendingRegistrationId: pendingId,
					status: data.status,
					registrationId: data.registrationId ?? null,
					zaloVerified: data.zaloVerifiedAt != null,
				});
				const phase = applyStatus(data);
				if (phase === 'ready') {
					stopPollLoop();
					return;
				}
				const delay =
					typeof data.pollAfterMs === 'number' && data.pollAfterMs > 0
						? data.pollAfterMs
						: POLL_INTERVAL_MS;
				schedulePoll(delay);
			} catch (e) {
				if (cancelled) return;
				const rateLimited =
					e instanceof MockTestOnlineApiError && e.errorCode === 'RATE_LIMITED';
				setError(
					rateLimited
						? 'Hệ thống tạm giới hạn kiểm tra trạng thái. Đang thử lại sau 1 phút…'
						: e instanceof Error
							? e.message
							: 'Lỗi kết nối. Đang thử lại…',
				);
				schedulePoll(
					rateLimited ? POLL_RATE_LIMIT_INTERVAL_MS : POLL_ERROR_INTERVAL_MS,
				);
			}
		};

		const startPollFallback = (opts?: { ignoreWs?: boolean }) => {
			if (cancelled || pollLoopActive) return;
			if (localWsConnected && !opts?.ignoreWs) return;
			syncPollActive = Boolean(opts?.ignoreWs);
			pollLoopActive = true;
			setTransport(localWsConnected ? 'ws' : 'poll');
			void runPoll();
		};

		const handleUnlockReady = (event: MockTestOnlineUnlockReadyEvent) => {
			if (cancelled || event.pendingRegistrationId !== pendingId) return;
			if (event.examSessionToken?.trim() && event.examSessionExpiresAt?.trim()) {
				patchSelectExamCache({
					pendingRegistrationId: pendingId,
					examSessionToken: event.examSessionToken.trim(),
					examSessionExpiresAt: event.examSessionExpiresAt.trim(),
				});
			}
			stopPollLoop();
			applyStatus(pollStatusFromUnlockReadyEvent(event));
		};

		unlockHandledRef.current = false;
		setTransport('idle');
		setWsConnected(false);
		setError(null);

		void (async () => {
			try {
				const hydrated = await fetchMockTestOnlinePendingStatus(pendingId);
				if (cancelled) return;
				const phase = applyStatus(hydrated);
				if (phase === 'ready') return;
				if (phase === 'verified') {
					startPollFallback({ ignoreWs: true });
				}
			} catch (e) {
				if (!cancelled) {
					setError(
						e instanceof Error ? e.message : 'Không thể tải trạng thái xác minh.',
					);
				}
			}

			const token = examSessionToken?.trim();
			const wsConfigured = isMockTestOnlineWsConfigured();
			const wsAvailable = Boolean(token) && wsConfigured;

			if (!wsAvailable) {
				if (!token) {
					setError(
						'Thiếu phiên realtime (examSessionToken). Vui lòng chọn lại bài thi hoặc tải lại trang.',
					);
				} else if (!wsConfigured) {
					setError(
						'Chưa cấu hình NEXT_PUBLIC_SOCIAL_GATEWAY_WS_ORIGIN — dùng kiểm tra HTTP định kỳ.',
					);
				}
				startPollFallback();
				return;
			}

			setTransport('ws');
			try {
				socket = connectMockTestOnlineSocket(token!);
			} catch (e) {
				setError(
					e instanceof Error ? e.message : 'Không kết nối được realtime. Dùng kiểm tra định kỳ.',
				);
				startPollFallback();
				return;
			}

			socket.on(MOCK_TEST_ONLINE_WS.CONNECTED, () => {
				if (cancelled) return;
				if (wsFallbackTimer) {
					clearTimeout(wsFallbackTimer);
					wsFallbackTimer = null;
				}
				localWsConnected = true;
				setWsConnected(true);
				stopPollLoop();
				setTransport('ws');
				setError(null);

				if (!unlockHandledRef.current) {
					void fetchMockTestOnlinePendingStatus(pendingId)
						.then((data) => {
							if (cancelled) return;
							const phase = applyStatus(data);
							if (phase === 'verified') {
								startPollFallback({ ignoreWs: true });
							}
						})
						.catch(() => {
							// Bỏ qua — chờ event hoặc user nhập mã
						});
				}
			});

			socket.on(MOCK_TEST_ONLINE_WS.UNLOCK_READY, handleUnlockReady);

			socket.on('connect_error', () => {
				if (cancelled || localWsConnected) return;
				startPollFallback();
			});

			socket.on('disconnect', () => {
				if (cancelled || unlockHandledRef.current) return;
				localWsConnected = false;
				setWsConnected(false);
				startPollFallback();
			});

			wsFallbackTimer = setTimeout(() => {
				if (!cancelled && !localWsConnected) {
					startPollFallback();
				}
			}, WS_CONNECT_FALLBACK_MS);
		})();

		return () => {
			cancelled = true;
			stopPollLoop();
			if (wsFallbackTimer) clearTimeout(wsFallbackTimer);
			socket?.off(MOCK_TEST_ONLINE_WS.UNLOCK_READY, handleUnlockReady);
			socket?.disconnect();
		};
	}, [applyStatus, enabled, examSessionToken, pendingRegistrationId]);

	return {
		status,
		zaloVerified,
		transport,
		wsConnected,
		error,
	};
}

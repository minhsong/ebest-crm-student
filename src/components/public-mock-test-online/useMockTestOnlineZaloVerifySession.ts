'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { patchSelectExamCache } from '@/lib/public-mock-test-online/exam-flow.util';
import { fetchMockTestOnlinePendingStatus } from '@/lib/public-mock-test-online/mock-test-online-api.client';
import {
	MOCK_TEST_ONLINE_WS,
	connectMockTestOnlineSocket,
	isMockTestOnlineWsConfigured,
	type MockTestOnlineUnlockReadyEvent,
} from '@/lib/public-mock-test-online/mock-test-online-ws-client';
import {
	isMockTestOnlineChannelVerified,
	pollStatusFromUnlockReadyEvent,
} from '@/lib/public-mock-test-online/mock-test-online-zalo-verify.util';
import type { MockTestOnlinePollStatus } from '@/lib/public-mock-test-online/types';
import { mtoClientDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';
import { MockTestOnlineApiError } from '@/lib/public-mock-test-online/mock-test-online-api-error';
import {
	getPortalActor,
	usePortalSession,
} from '@/contexts/portal-session-context';
import { useMockTestOnlineLeadSessionProvision } from '@/components/public-mock-test-online/useMockTestOnlineLeadSessionProvision';

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
	portalSessionReady: boolean;
	transport: MockTestOnlineZaloVerifyTransport;
	wsConnected: boolean;
	error: string | null;
	verifyIssue: MockTestOnlinePollStatus['verifyIssue'] | null;
	/** Force re-fetch status ngay (dev simulate / nút thử lại). */
	recheck: () => Promise<void>;
};

export function useMockTestOnlineZaloVerifySession({
	pendingRegistrationId,
	examSessionToken,
	enabled,
	onUnlockReady,
}: Args): Result {
	const portalSession = usePortalSession();
	const portalActor = getPortalActor(portalSession);
	const refreshPortalSession = portalSession.refresh;
	const [status, setStatus] = useState<MockTestOnlinePollStatus | null>(null);
	const [zaloVerified, setZaloVerified] = useState(false);
	const [transport, setTransport] =
		useState<MockTestOnlineZaloVerifyTransport>('idle');
	const [wsConnected, setWsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [verifyIssue, setVerifyIssue] = useState<
		MockTestOnlinePollStatus['verifyIssue'] | null
	>(null);

	const {
		portalSessionReady,
		provisionError,
		maybeProvisionLeadSession,
		resetProvisionState,
	} = useMockTestOnlineLeadSessionProvision({
		pendingRegistrationId,
		portalActor,
		refreshPortalSession,
	});

	const onUnlockReadyRef = useRef(onUnlockReady);
	onUnlockReadyRef.current = onUnlockReady;
	const unlockHandledRef = useRef(false);

	/** `verified` tiếp tục poll cho đến khi provision+hydrate thành công và navigate. */
	const applyStatus = useCallback(
		(next: MockTestOnlinePollStatus): 'verified' | 'pending' => {
			setStatus(next);
			setVerifyIssue(next.verifyIssue ?? null);
			const verified = isMockTestOnlineChannelVerified(next);
			setZaloVerified(verified);
			if (verified) {
				setVerifyIssue(null);
			}
			if (verified && next.registrationId && next.registrationId >= 1) {
				const registrationId = next.registrationId;
				void maybeProvisionLeadSession(next).then((sessionReady) => {
					if (!sessionReady || unlockHandledRef.current) return;
					unlockHandledRef.current = true;
					onUnlockReadyRef.current(registrationId);
				});
				return 'verified';
			}
			if (verified) void maybeProvisionLeadSession(next);
			if (verified) return 'verified';
			return 'pending';
		},
		[maybeProvisionLeadSession],
	);

	// Ref để effect transport không phụ thuộc identity applyStatus:
	// portal session đổi (guest→lead sau provision) không được tear down WS/poll.
	const applyStatusRef = useRef(applyStatus);
	applyStatusRef.current = applyStatus;

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
				applyStatusRef.current(data);
				if (unlockHandledRef.current) {
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
			applyStatusRef.current(pollStatusFromUnlockReadyEvent(event));
			startPollFallback({ ignoreWs: true });
		};

		unlockHandledRef.current = false;
		resetProvisionState();
		setTransport('idle');
		setWsConnected(false);
		setError(null);
		setVerifyIssue(null);

		void (async () => {
			try {
				const hydrated = await fetchMockTestOnlinePendingStatus(pendingId);
				if (cancelled) return;
				const phase = applyStatusRef.current(hydrated);
				if (phase === 'verified') {
					startPollFallback({ ignoreWs: true });
				}
			} catch (e) {
				if (!cancelled) {
					setError(
						e instanceof Error
							? e.message
							: 'Không thể tải trạng thái xác minh.',
					);
				}
			}

			const token = examSessionToken?.trim();
			const wsConfigured = isMockTestOnlineWsConfigured();
			const wsAvailable = Boolean(token) && wsConfigured;

			if (!wsAvailable) {
				if (!token) {
					setError(
						'Chưa sẵn sàng cập nhật tự động. Bạn vẫn có thể gửi tin Zalo; nếu trang không tự chuyển, nhập mã từ tin nhắn hoặc tải lại trang.',
					);
				} else if (!wsConfigured) {
					setError(
						'Đang kiểm tra trạng thái định kỳ. Giữ tab này mở sau khi gửi tin Zalo.',
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
					e instanceof Error
						? e.message
						: 'Không kết nối được realtime. Dùng kiểm tra định kỳ.',
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
							const phase = applyStatusRef.current(data);
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
	}, [
		enabled,
		examSessionToken,
		pendingRegistrationId,
		resetProvisionState,
	]);

	const recheck = useCallback(async () => {
		const pendingId = pendingRegistrationId?.trim();
		if (!pendingId) return;
		try {
			const data = await fetchMockTestOnlinePendingStatus(pendingId);
			applyStatusRef.current(data);
		} catch {
			// UI đang có poll/WS chạy nền — bỏ qua lỗi tức thời
		}
	}, [pendingRegistrationId]);

	return {
		status,
		zaloVerified,
		portalSessionReady,
		transport,
		wsConnected,
		error: provisionError ?? error,
		verifyIssue,
		recheck,
	};
}

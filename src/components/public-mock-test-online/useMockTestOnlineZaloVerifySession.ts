'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { patchSelectExamCache } from '@/lib/public-mock-test-online/exam-flow.util';
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
import {
	getPortalActor,
	usePortalSession,
} from '@/contexts/portal-session-context';
import { useMockTestOnlineLeadSessionProvision } from '@/components/public-mock-test-online/useMockTestOnlineLeadSessionProvision';

export type MockTestOnlineZaloVerifyTransport = 'ws' | 'manual' | 'idle';

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
};

/**
 * Chờ Zalo UNLOCK: **chỉ WebSocket** (không poll status / CRM).
 * User nhập mã → verify-unlock-code một lần tại submit.
 */
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

	const applyStatus = useCallback(
		(next: MockTestOnlinePollStatus): 'verified' | 'pending' => {
			setStatus(next);
			setVerifyIssue(next.verifyIssue ?? null);
			const verified = isMockTestOnlineChannelVerified(next);
			setZaloVerified(verified);
			if (verified) setVerifyIssue(null);
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
			return verified ? 'verified' : 'pending';
		},
		[maybeProvisionLeadSession],
	);

	const applyStatusRef = useRef(applyStatus);
	applyStatusRef.current = applyStatus;

	useEffect(() => {
		if (!enabled || !pendingRegistrationId?.trim()) {
			return;
		}

		const pendingId = pendingRegistrationId.trim();
		let cancelled = false;
		let socket: Socket | null = null;

		unlockHandledRef.current = false;
		resetProvisionState();
		setWsConnected(false);
		setError(null);
		setVerifyIssue(null);

		const handleUnlockReady = (event: MockTestOnlineUnlockReadyEvent) => {
			if (cancelled || event.pendingRegistrationId !== pendingId) return;
			mtoClientDebug('ws.unlock_ready', {
				pendingRegistrationId: pendingId,
				registrationId: event.registrationId,
			});
			if (event.examSessionToken?.trim() && event.examSessionExpiresAt?.trim()) {
				patchSelectExamCache({
					pendingRegistrationId: pendingId,
					examSessionToken: event.examSessionToken.trim(),
					examSessionExpiresAt: event.examSessionExpiresAt.trim(),
				});
			}
			applyStatusRef.current(pollStatusFromUnlockReadyEvent(event));
		};

		const token = examSessionToken?.trim();
		const wsConfigured = isMockTestOnlineWsConfigured();

		if (!token || !wsConfigured) {
			setTransport('manual');
			setError(
				!token
					? 'Chưa sẵn sàng cập nhật realtime. Sau khi gửi tin Zalo, nhập mã làm bài từ tin nhắn OA.'
					: 'Realtime chưa cấu hình. Sau khi gửi tin Zalo, nhập mã làm bài từ tin nhắn OA.',
			);
			return;
		}

		setTransport('ws');
		try {
			socket = connectMockTestOnlineSocket(token);
		} catch (e) {
			setTransport('manual');
			setError(
				e instanceof Error
					? e.message
					: 'Không kết nối realtime. Nhập mã làm bài từ tin nhắn Zalo OA.',
			);
			return;
		}

		socket.on(MOCK_TEST_ONLINE_WS.CONNECTED, () => {
			if (cancelled) return;
			setWsConnected(true);
			setTransport('ws');
			setError(null);
		});

		socket.on(MOCK_TEST_ONLINE_WS.UNLOCK_READY, handleUnlockReady);

		socket.on('connect_error', () => {
			if (cancelled || unlockHandledRef.current) return;
			setWsConnected(false);
			setTransport('manual');
			setError(
				'Không kết nối realtime. Sau khi gửi tin Zalo, nhập mã làm bài từ tin nhắn OA.',
			);
		});

		socket.on('disconnect', () => {
			if (cancelled || unlockHandledRef.current) return;
			setWsConnected(false);
			setTransport('manual');
			setError(
				'Mất kết nối realtime. Nhập mã làm bài từ tin nhắn Zalo OA để tiếp tục.',
			);
		});

		return () => {
			cancelled = true;
			socket?.off(MOCK_TEST_ONLINE_WS.UNLOCK_READY, handleUnlockReady);
			socket?.disconnect();
		};
	}, [
		enabled,
		examSessionToken,
		pendingRegistrationId,
		resetProvisionState,
	]);

	return {
		status,
		zaloVerified,
		portalSessionReady,
		transport,
		wsConnected,
		error: provisionError ?? error,
		verifyIssue,
	};
}

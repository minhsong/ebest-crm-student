'use client';

import { useCallback, useRef, useState } from 'react';
import { provisionLeadPortalSession } from '@/lib/public-mock-test-online/mock-test-online-api.client';
import { isMockTestOnlineChannelVerified } from '@/lib/public-mock-test-online/mock-test-online-zalo-verify.util';
import type { MockTestOnlinePollStatus } from '@/lib/public-mock-test-online/types';
import { mtoClientDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';
import { MockTestOnlineApiError } from '@/lib/public-mock-test-online/mock-test-online-api-error';
import type { PortalSessionReadyState } from '@/contexts/portal-session-context';

const PORTAL_PROVISION_RETRY_DELAYS_MS = [0, 800, 1600] as const;

type Args = {
	pendingRegistrationId: string | null | undefined;
	portalActor: 'guest' | 'customer' | 'lead' | null;
	refreshPortalSession: () => Promise<PortalSessionReadyState>;
};

type Result = {
	portalSessionReady: boolean;
	provisionError: string | null;
	/** Gọi sau Zalo verified — idempotent + retry. */
	maybeProvisionLeadSession: (
		status: MockTestOnlinePollStatus,
	) => Promise<boolean>;
	/** Reset khi transport effect rehydrate (pendingId đổi). */
	resetProvisionState: () => void;
};

/**
 * Provision Lead passwordless + hydrate portal session sau Zalo.
 * Tách khỏi WS/poll transport để hook verify gọn và tái sử dụng.
 */
export function useMockTestOnlineLeadSessionProvision({
	pendingRegistrationId,
	portalActor,
	refreshPortalSession,
}: Args): Result {
	const [portalSessionReady, setPortalSessionReady] = useState(false);
	const [provisionError, setProvisionError] = useState<string | null>(null);
	const leadSessionProvisionedRef = useRef(false);
	const provisionPromiseRef = useRef<Promise<boolean> | null>(null);

	const resetProvisionState = useCallback(() => {
		leadSessionProvisionedRef.current = false;
		provisionPromiseRef.current = null;
		setPortalSessionReady(false);
		setProvisionError(null);
	}, []);

	const maybeProvisionLeadSession = useCallback(
		(status: MockTestOnlinePollStatus): Promise<boolean> => {
			const pendingId = pendingRegistrationId?.trim();
			if (!pendingId || !isMockTestOnlineChannelVerified(status)) {
				return Promise.resolve(false);
			}
			// Customer đã login: exam dùng mto_portal_auth — không mint Lead lên portal_at.
			if (portalActor === 'customer') {
				leadSessionProvisionedRef.current = true;
				setPortalSessionReady(true);
				setProvisionError(null);
				return Promise.resolve(true);
			}
			if (leadSessionProvisionedRef.current) return Promise.resolve(true);
			if (provisionPromiseRef.current) return provisionPromiseRef.current;

			const registrationId =
				status.registrationId && status.registrationId >= 1
					? status.registrationId
					: undefined;

			const provision = (async () => {
				let lastError: unknown = null;
				for (const delayMs of PORTAL_PROVISION_RETRY_DELAYS_MS) {
					if (delayMs > 0) {
						await new Promise((resolve) =>
							window.setTimeout(resolve, delayMs),
						);
					}
					try {
						const result = await provisionLeadPortalSession({
							pendingRegistrationId: pendingId,
							...(registrationId != null ? { registrationId } : {}),
						});
						if (!result.sessionReady) {
							throw new MockTestOnlineApiError(
								'Chưa tạo được phiên cổng học viên.',
							);
						}
						const refreshed = await refreshPortalSession();
						if (
							refreshed.actor !== 'lead' &&
							refreshed.actor !== 'customer'
						) {
							throw new MockTestOnlineApiError(
								'Phiên cổng học viên chưa sẵn sàng.',
							);
						}
						leadSessionProvisionedRef.current = true;
						setPortalSessionReady(true);
						setProvisionError(null);
						return true;
					} catch (error) {
						lastError = error;
					}
				}

				mtoClientDebug('provision.lead_session.failed', {
					pendingRegistrationId: pendingId,
					registrationId: registrationId ?? null,
					message:
						lastError instanceof Error
							? lastError.message
							: String(lastError),
				});
				setProvisionError(
					'Đã xác minh Zalo nhưng chưa tạo được phiên cổng học viên. Vui lòng giữ trang này và thử lại.',
				);
				return false;
			})().finally(() => {
				provisionPromiseRef.current = null;
			});

			provisionPromiseRef.current = provision;
			return provision;
		},
		[pendingRegistrationId, portalActor, refreshPortalSession],
	);

	return {
		portalSessionReady,
		provisionError,
		maybeProvisionLeadSession,
		resetProvisionState,
	};
}

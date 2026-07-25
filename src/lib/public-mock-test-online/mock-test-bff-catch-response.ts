import { NextResponse } from 'next/server';

import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import {
	briefErrorDetail,
	isMockTestBffErrorDetailsEnabled,
} from '@/lib/public-mock-test-online/mock-test-error-details';
import {
	logMtoLayerError,
	type MtoErrorModule,
} from '@/lib/public-mock-test-online/mto-layer-error';
import {
	createPortalRequestId,
	getPortalRequestId,
} from '@/lib/portal-request-context';

/**
 * Terminal BFF catch → JSON lỗi cho client.
 * Log layer `bff` + requestId; **không** rethrow (boundary HTTP).
 * Intermediate helpers phải dùng `logAndRethrowMtoError` trước khi tới đây.
 */
export function mockTestBffCatchResponse(
	error: unknown,
	options?: {
		message?: string;
		errorCode?: string;
		status?: number;
		logContext?: string;
		path?: string;
		method?: string;
		module?: MtoErrorModule;
		operation?: string;
		requestId?: string;
	},
): NextResponse {
	const requestId =
		options?.requestId?.trim() ||
		getPortalRequestId() ||
		createPortalRequestId();

	const operation =
		options?.operation ??
		options?.errorCode ??
		options?.logContext ??
		'bff-catch';
	const moduleName = options?.module ?? 'mto-bff';

	logMtoLayerError(error, {
		module: moduleName,
		operation,
		layer: 'bff',
		path: options?.path,
		method: options?.method,
		requestId,
		errorType: options?.errorCode ?? 'BFF_UPSTREAM_ERROR',
	});

	const body: Record<string, unknown> = {
		message: options?.message ?? STUDENT_SAFE_USER_MESSAGES.generic,
		requestId,
	};
	if (isMockTestBffErrorDetailsEnabled()) {
		body.detail = briefErrorDetail(error);
		body.errorCode = options?.errorCode ?? 'BFF_UPSTREAM_ERROR';
	}
	return NextResponse.json(body, {
		status: options?.status ?? 502,
		headers: { 'X-Request-Id': requestId },
	});
}

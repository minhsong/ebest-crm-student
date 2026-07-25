import { NextRequest, NextResponse } from 'next/server';
import { withMtoBffRequest } from '@/lib/public-mock-test-online/with-mto-bff-request';
import { logMtoLayerError } from '@/lib/public-mock-test-online/mto-layer-error';

/**
 * Client error.tsx / boundary → CRM log platform (service=student-portal).
 * Log đúng module client/boundary + requestId; không trả chi tiết nội bộ.
 */
export async function POST(req: NextRequest) {
	return withMtoBffRequest(req, async (requestId) => {
		const body = (await req.json().catch(() => ({}))) as {
			context?: string;
			message?: string;
			digest?: string;
			path?: string;
			stack?: string;
			requestId?: string;
			module?: string;
		};

		const rid = body.requestId?.trim() || requestId;
		const context =
			typeof body.context === 'string' && body.context.trim()
				? body.context.trim().slice(0, 200)
				: 'mto.client-error';
		const message =
			typeof body.message === 'string' && body.message.trim()
				? body.message.trim().slice(0, 2000)
				: 'Unknown client error';

		const err = new Error(message);
		if (typeof body.stack === 'string') {
			err.stack = body.stack.slice(0, 4000);
		}

		logMtoLayerError(err, {
			module: body.module?.trim() || 'mto-bff',
			operation: context,
			layer: 'client',
			path: typeof body.path === 'string' ? body.path.slice(0, 500) : undefined,
			method: 'CLIENT',
			requestId: rid,
			errorType: 'MTO_CLIENT_SEGMENT_ERROR',
			extra: {
				digest:
					typeof body.digest === 'string'
						? body.digest.slice(0, 200)
						: undefined,
			},
		});

		return NextResponse.json(
			{ ok: true, requestId: rid },
			{ headers: { 'X-Request-Id': rid } },
		);
	});
}

import { NextRequest } from 'next/server';

import { proxyDrillWeekScoreToGateway } from '@/lib/learning-drill-gateway-proxy';

export async function GET(request: NextRequest) {
	return proxyDrillWeekScoreToGateway(request);
}

import { NextRequest } from 'next/server';

import { proxyDrillLeaderboardToGateway } from '@/lib/learning-drill-gateway-proxy';

export async function GET(request: NextRequest) {
	return proxyDrillLeaderboardToGateway(request);
}

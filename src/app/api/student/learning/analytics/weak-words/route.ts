import { NextRequest } from 'next/server';

import { proxyDrillWeakWordsToGateway } from '@/lib/learning-drill-gateway-proxy';

export async function GET(request: NextRequest) {
	return proxyDrillWeakWordsToGateway(request);
}

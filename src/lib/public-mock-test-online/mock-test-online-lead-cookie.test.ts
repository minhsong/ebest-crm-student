import { NextResponse } from 'next/server';
import { clearMockTestOnlineFunnelSessionCookie } from './mock-test-online-lead-cookie';

describe('mock-test-online-lead-cookie (clear-only)', () => {
  it('clears canonical + legacy funnel cookie names', () => {
    const response = NextResponse.json({ ok: true });
    clearMockTestOnlineFunnelSessionCookie(response);
    const names = response.cookies.getAll().map((c) => c.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'mto_funnel_session_v2',
        'mto_funnel_session',
        'mto_pending_lead',
      ]),
    );
  });
});

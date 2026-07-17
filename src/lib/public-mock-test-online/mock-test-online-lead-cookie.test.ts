import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import {
  applyMockTestOnlineFunnelSessionCookie,
  clearMockTestOnlineFunnelSessionCookie,
  MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE,
  MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2,
  MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE,
} from './mock-test-online-lead-cookie';

describe('mock-test funnel cookie scope', () => {
  it('writes v2 at root for BFF and legacy cookies at funnel path', () => {
    const response = applyMockTestOnlineFunnelSessionCookie(
      NextResponse.next(),
      'funnel-1',
    );
    const values = response.cookies.getAll();

    expect(values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2,
          value: 'funnel-1',
          path: '/',
        }),
        expect.objectContaining({
          name: MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE,
          value: 'funnel-1',
          path: '/mock-test-online',
        }),
        expect.objectContaining({
          name: MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE,
          value: 'funnel-1',
          path: '/mock-test-online',
        }),
      ]),
    );
  });

  it('clears both root v2 and legacy cookie names', () => {
    const response = clearMockTestOnlineFunnelSessionCookie(
      NextResponse.next(),
    );
    expect(response.cookies.getAll()).toHaveLength(3);
    expect(
      response.cookies.get(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2)?.value,
    ).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { isMockTestOnlineChannelVerified } from './mock-test-online-zalo-verify.util';

describe('isMockTestOnlineChannelVerified', () => {
  it('accepts zalo_verified, channel_verified, and examUnlockActive', () => {
    expect(
      isMockTestOnlineChannelVerified({
        registrationId: 1,
        status: 'zalo_verified',
        zaloVerifiedAt: '2026-07-20T00:00:00.000Z',
        examUnlockActive: false,
        examUnlockExpiresAt: null,
        pollAfterMs: 0,
      }),
    ).toBe(true);
    expect(
      isMockTestOnlineChannelVerified({
        registrationId: 2,
        status: 'channel_verified',
        zaloVerifiedAt: null,
        examUnlockActive: false,
        examUnlockExpiresAt: null,
        pollAfterMs: 0,
      }),
    ).toBe(true);
    expect(
      isMockTestOnlineChannelVerified({
        registrationId: 3,
        status: 'pending_zalo_verify',
        zaloVerifiedAt: null,
        examUnlockActive: true,
        examUnlockExpiresAt: '2099-01-01T00:00:00.000Z',
        pollAfterMs: 0,
      }),
    ).toBe(true);
  });

  it('rejects unverified pending', () => {
    expect(
      isMockTestOnlineChannelVerified({
        registrationId: null,
        status: 'pending_zalo_verify',
        zaloVerifiedAt: null,
        examUnlockActive: false,
        examUnlockExpiresAt: null,
        pollAfterMs: 3000,
      }),
    ).toBe(false);
  });
});

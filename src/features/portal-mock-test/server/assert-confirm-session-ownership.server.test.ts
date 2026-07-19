import { describe, expect, it } from 'vitest';
import { funnelOwnsPendingRegistration } from './assert-confirm-session-ownership.server';

describe('funnelOwnsPendingRegistration', () => {
  it('should accept matching pending ids', () => {
    expect(
      funnelOwnsPendingRegistration(' pending-1 ', 'pending-1'),
    ).toBe(true);
  });

  it('should reject missing or mismatched pending ids', () => {
    expect(funnelOwnsPendingRegistration(null, 'pending-1')).toBe(false);
    expect(
      funnelOwnsPendingRegistration('pending-1', 'pending-2'),
    ).toBe(false);
  });
});

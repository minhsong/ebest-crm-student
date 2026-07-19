import { describe, expect, it } from 'vitest';
import {
  allowlistGoogleRegisterClientPayload,
  extractGoogleSessionCredential,
} from './portal-google-register-allowlist';

describe('allowlistGoogleRegisterClientPayload', () => {
  it('extracts cookie actor from CRM and rejects malformed session', () => {
    expect(
      extractGoogleSessionCredential({
        flow: 'session',
        actor: 'customer',
        accessToken: ' customer-jwt ',
      }),
    ).toEqual({ actor: 'customer', accessToken: 'customer-jwt' });
    expect(
      extractGoogleSessionCredential({
        flow: 'session',
        actor: 'unknown',
        accessToken: 'jwt',
      }),
    ).toBeNull();
    expect(
      extractGoogleSessionCredential({
        flow: 'session',
        actor: 'lead',
      }),
    ).toBeNull();
  });

  it('strips accessToken and internal ids from session', () => {
    const out = allowlistGoogleRegisterClientPayload({
      flow: 'session',
      actor: 'lead',
      accessToken: 'secret-jwt',
      expiresIn: '7d',
      account: {
        id: 99,
        displayName: 'An',
        email: 'a@example.com',
        phoneE164: '+8490',
        emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        profileCompleted: false,
        omniLeadId: 'should-not-leak',
      },
      googleSub: 'sub',
      omniLeadId: 'omni',
      leadAccountId: 1,
    });
    expect(out).toEqual({
      flow: 'session',
      actor: 'lead',
      expiresIn: '7d',
      account: {
        displayName: 'An',
        email: 'a@example.com',
        phoneE164: '+8490',
        emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        profileCompleted: false,
      },
    });
    expect(JSON.stringify(out)).not.toContain('secret-jwt');
    expect(JSON.stringify(out)).not.toContain('omni');
    expect(JSON.stringify(out)).not.toContain('should-not-leak');
  });

  it('keeps explicit null phone for Google-only Lead session', () => {
    expect(
      allowlistGoogleRegisterClientPayload({
        flow: 'session',
        actor: 'lead',
        accessToken: 'secret-jwt',
        account: {
          displayName: 'An',
          email: 'a@example.com',
          phoneE164: null,
          emailVerifiedAt: '2026-07-20T00:00:00.000Z',
          profileCompleted: false,
        },
      }),
    ).toMatchObject({
      account: { phoneE164: null },
    });
  });

  it('keeps ticket + prefill for register_ticket', () => {
    expect(
      allowlistGoogleRegisterClientPayload({
        flow: 'register_ticket',
        ticket: 'abc',
        prefill: { email: 'n@example.com', displayName: 'N', googleSub: 'x' },
        googleSub: 'x',
      }),
    ).toEqual({
      flow: 'register_ticket',
      ticket: 'abc',
      prefill: { email: 'n@example.com', displayName: 'N' },
    });
  });

  it('allowlists password_link and complete_profile', () => {
    expect(
      allowlistGoogleRegisterClientPayload({
        flow: 'password_link',
        actor: 'customer',
        ticket: 't1',
        message: 'Nhập mật khẩu',
        customerId: 5,
      }),
    ).toEqual({
      flow: 'password_link',
      actor: 'customer',
      ticket: 't1',
      message: 'Nhập mật khẩu',
    });

    expect(
      allowlistGoogleRegisterClientPayload({
        flow: 'complete_profile',
        actor: 'customer',
        completeProfileUrl: 'https://x/complete',
        reason: 'needs_password',
        customerId: 9,
      }),
    ).toEqual({
      flow: 'complete_profile',
      actor: 'customer',
      completeProfileUrl: 'https://x/complete',
      reason: 'needs_password',
    });
  });
});

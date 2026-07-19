import { describe, expect, it } from 'vitest';
import { parseGoogleRegisterFlow } from './google-register-client';

describe('parseGoogleRegisterFlow', () => {
  it('parses new Lead registration prefill', () => {
    expect(
      parseGoogleRegisterFlow({
        flow: 'register_ticket',
        ticket: 'ticket',
        prefill: { email: 'lead@example.com', displayName: 'Lead' },
      }),
    ).toEqual({
      flow: 'register_ticket',
      ticket: 'ticket',
      prefill: { email: 'lead@example.com', displayName: 'Lead' },
    });
  });

  it('parses password challenge with CRM actor', () => {
    expect(
      parseGoogleRegisterFlow({
        flow: 'password_link',
        actor: 'customer',
        ticket: 'ticket',
        message: 'Nhập mật khẩu',
      }),
    ).toEqual({
      flow: 'password_link',
      actor: 'customer',
      ticket: 'ticket',
      message: 'Nhập mật khẩu',
    });
  });

  it('rejects a registration flow without ticket', () => {
    expect(
      parseGoogleRegisterFlow({
        flow: 'register_ticket',
        prefill: { email: 'lead@example.com' },
      }),
    ).toBeNull();
  });

  it('rejects a session without canonical CRM actor', () => {
    expect(
      parseGoogleRegisterFlow({
        flow: 'session',
        actor: 'unknown',
      }),
    ).toBeNull();
  });

  it('rejects a password-link flow without canonical CRM actor', () => {
    expect(
      parseGoogleRegisterFlow({
        flow: 'password_link',
        actor: 'unknown',
        ticket: 'ticket',
      }),
    ).toBeNull();
  });
});

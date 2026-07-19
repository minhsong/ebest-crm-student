import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingGoogleRegistration,
  readPendingGoogleRegistration,
  storePendingGoogleRegistration,
} from './google-register-pending.client';

describe('pending Google registration storage', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  it('keeps pending ticket readable across reloads until success', () => {
    storePendingGoogleRegistration({
      ticket: 'ticket',
      email: 'user@example.com',
    });

    expect(readPendingGoogleRegistration()?.ticket).toBe('ticket');
    expect(readPendingGoogleRegistration()?.ticket).toBe('ticket');

    clearPendingGoogleRegistration();
    expect(readPendingGoogleRegistration()).toBeNull();
  });

  it('keeps safe returnUrl and drops unsafe ones', () => {
    storePendingGoogleRegistration({
      ticket: 'ticket',
      email: 'user@example.com',
      returnUrl: '/mock-test/online/start',
    });
    expect(readPendingGoogleRegistration()?.returnUrl).toBe(
      '/mock-test/online/start',
    );

    storePendingGoogleRegistration({
      ticket: 'ticket-2',
      email: 'user@example.com',
      returnUrl: 'https://evil.example',
    });
    expect(readPendingGoogleRegistration()?.returnUrl).toBeUndefined();
  });
});

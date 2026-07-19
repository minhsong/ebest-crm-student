import { describe, expect, it } from 'vitest';
import { resolveLeadOnlineBootstrapEntryMode } from './lead-bootstrap-entry-mode';

describe('resolveLeadOnlineBootstrapEntryMode', () => {
  it('uses google_fast entry when Google is linked even if phone exists', () => {
    expect(
      resolveLeadOnlineBootstrapEntryMode({
        googleLinked: true,
        phoneE164: '+84901234567',
      }),
    ).toBe('google_fast');
  });

  it('uses Google fallback for legacy phone-less profile', () => {
    expect(
      resolveLeadOnlineBootstrapEntryMode({
        googleLinked: false,
        phoneE164: null,
      }),
    ).toBe('google_fast');
  });

  it('uses Zalo retake for non-Google account with phone', () => {
    expect(
      resolveLeadOnlineBootstrapEntryMode({
        googleLinked: false,
        phoneE164: '+84901234567',
      }),
    ).toBe('retake_zalo');
  });
});

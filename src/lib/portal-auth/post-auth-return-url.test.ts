import { describe, expect, it } from 'vitest';
import {
  buildPortalLoginHref,
  resolvePostAuthReturnUrl,
  sanitizePortalReturnUrl,
} from './post-auth-return-url';

describe('post auth return URL', () => {
  it('chỉ nhận đường dẫn nội bộ an toàn', () => {
    expect(sanitizePortalReturnUrl('/mock-test/results?tab=latest')).toBe(
      '/mock-test/results?tab=latest',
    );
    expect(sanitizePortalReturnUrl('https://evil.example')).toBeNull();
    expect(sanitizePortalReturnUrl('//evil.example')).toBeNull();
    expect(sanitizePortalReturnUrl('/\\evil.example')).toBeNull();
    expect(sanitizePortalReturnUrl('/mock-test\n/results')).toBeNull();
  });

  it('ưu tiên returnUrl và dual-read redirect cũ', () => {
    expect(
      resolvePostAuthReturnUrl(
        new URLSearchParams(
          'returnUrl=%2Fmock-test%2Fresults&redirect=%2Flegacy',
        ),
      ),
    ).toBe('/mock-test/results');
    expect(
      resolvePostAuthReturnUrl(
        new URLSearchParams('redirect=%2Fmock-test%2Fonline%2Fstart'),
      ),
    ).toBe('/mock-test/online/start');
  });

  it('không fallback sang redirect cũ khi cả hai đều không an toàn', () => {
    expect(
      resolvePostAuthReturnUrl(
        new URLSearchParams(
          'returnUrl=https%3A%2F%2Fevil.example&redirect=%2F%2Fevil.example',
        ),
      ),
    ).toBeNull();
  });

  it('chỉ ghi query canonical returnUrl', () => {
    const href = buildPortalLoginHref({
      mode: 'lead',
      sessionExpired: true,
      returnUrl: '/mock-test/results?notice=done',
    });
    expect(href).toContain('returnUrl=');
    expect(href).not.toContain('redirect=');
  });
});

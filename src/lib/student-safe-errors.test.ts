import { describe, expect, it } from 'vitest';
import {
  isUpstreamConnectionFailure,
  sanitizeStudentFacingMessage,
  STUDENT_SAFE_USER_MESSAGES,
} from './student-safe-errors';

describe('isUpstreamConnectionFailure', () => {
  it('detects Node fetch failed TypeError', () => {
    expect(
      isUpstreamConnectionFailure(new TypeError('fetch failed')),
    ).toBe(true);
  });

  it('detects browser Failed to fetch', () => {
    expect(
      isUpstreamConnectionFailure(new TypeError('Failed to fetch')),
    ).toBe(true);
  });

  it('detects ECONNREFUSED cause', () => {
    const err = new TypeError('fetch failed');
    Object.assign(err, { cause: { code: 'ECONNREFUSED' } });
    expect(isUpstreamConnectionFailure(err)).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isUpstreamConnectionFailure(new Error('VALIDATION_FAILED'))).toBe(
      false,
    );
  });
});

describe('sanitizeStudentFacingMessage', () => {
  it('hides fetch failed behind network fallback', () => {
    expect(
      sanitizeStudentFacingMessage(
        'fetch failed',
        STUDENT_SAFE_USER_MESSAGES.network,
      ),
    ).toBe(STUDENT_SAFE_USER_MESSAGES.network);
  });
});

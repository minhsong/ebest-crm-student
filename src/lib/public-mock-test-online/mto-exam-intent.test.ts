import { describe, expect, it } from 'vitest';
import {
  buildSelectExamIntentPath,
  parseSelectExamIntentFromSearchParams,
} from './mto-exam-intent';

describe('mto-exam-intent', () => {
  it('builds select path with sessionId', () => {
    expect(buildSelectExamIntentPath({ sessionId: 16 })).toBe(
      '/mock-test-online/select-exam?sessionId=16',
    );
  });

  it('includes variant when present', () => {
    expect(
      buildSelectExamIntentPath({ sessionId: 16, testVariantChoice: 'mini' }),
    ).toBe('/mock-test-online/select-exam?sessionId=16&variant=mini');
  });

  it('parses sessionId or campaign alias', () => {
    expect(
      parseSelectExamIntentFromSearchParams({ sessionId: '16', variant: 'full' }),
    ).toEqual({ sessionId: 16, testVariantChoice: 'full' });
    expect(
      parseSelectExamIntentFromSearchParams({ campaign: '90' }),
    ).toEqual({ sessionId: 90 });
    expect(parseSelectExamIntentFromSearchParams({})).toBeNull();
  });
});

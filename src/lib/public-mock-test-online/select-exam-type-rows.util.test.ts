import { describe, expect, it } from 'vitest';
import {
  buildSelectExamTypeRows,
  formatQuestionCountMeta,
} from './select-exam-type-rows.util';
import type { MockTestOnlineCampaign } from './types';

describe('buildSelectExamTypeRows', () => {
  const campaigns: MockTestOnlineCampaign[] = [
    {
      sessionId: 1,
      title: 'TOEIC đợt 1',
      slug: 't1',
      testTypeCode: 'toeic_lr',
      variantMode: null,
      registrationOpensAt: null,
      registrationDeadlineAt: null,
      estimatedDurationMinutes: 120,
      questionCount: 200,
      marketingBlurb: null,
    },
    {
      sessionId: 2,
      title: 'UDN đợt A',
      slug: 'u1',
      testTypeCode: 'udn_placement',
      variantMode: null,
      registrationOpensAt: null,
      registrationDeadlineAt: null,
      estimatedDurationMinutes: 90,
      questionCount: 100,
      marketingBlurb: null,
    },
  ];

  it('groups by type and prefers presentation displayName', () => {
    const rows = buildSelectExamTypeRows(campaigns, [
      {
        testTypeCode: 'toeic_lr',
        displayNameVi: 'TOEIC L/R',
        sortOrder: 10,
        descriptionHtmlVi: '<p>TOEIC</p>',
        highlightsVi: ['990'],
        isListedOnSelectExam: true,
      },
      {
        testTypeCode: 'udn_placement',
        displayNameVi: 'Đầu vào ĐHĐN',
        sortOrder: 20,
        descriptionHtmlVi: '',
        isListedOnSelectExam: true,
      },
    ]);
    expect(rows.map((r) => r.testTypeCode)).toEqual([
      'toeic_lr',
      'udn_placement',
    ]);
    expect(rows[0]?.displayNameVi).toBe('TOEIC L/R');
    expect(rows[0]?.questionCountMin).toBe(200);
  });

  it('hides types missing from non-empty presentations payload (unlisted filtered)', () => {
    const rows = buildSelectExamTypeRows(campaigns, [
      {
        testTypeCode: 'toeic_lr',
        displayNameVi: 'TOEIC',
        sortOrder: 1,
        descriptionHtmlVi: '',
        isListedOnSelectExam: true,
      },
    ]);
    expect(rows.map((r) => r.testTypeCode)).toEqual(['toeic_lr']);
  });

  it('hides types with isListedOnSelectExam=false', () => {
    const rows = buildSelectExamTypeRows(campaigns, [
      {
        testTypeCode: 'toeic_lr',
        displayNameVi: 'TOEIC',
        sortOrder: 1,
        descriptionHtmlVi: '',
        isListedOnSelectExam: false,
      },
      {
        testTypeCode: 'udn_placement',
        displayNameVi: 'UDN',
        sortOrder: 2,
        descriptionHtmlVi: '',
        isListedOnSelectExam: true,
      },
    ]);
    expect(rows.map((r) => r.testTypeCode)).toEqual(['udn_placement']);
  });
});

describe('formatQuestionCountMeta', () => {
  it('formats single and range', () => {
    expect(formatQuestionCountMeta(100, 100)).toBe('100 câu');
    expect(formatQuestionCountMeta(50, 200)).toBe('50–200 câu');
    expect(formatQuestionCountMeta(null, null)).toBeNull();
  });

  it('appends mini range when present', () => {
    expect(
      formatQuestionCountMeta(200, 200, { miniMin: 100, miniMax: 100 }),
    ).toBe('200 câu · 100 câu (mini)');
  });
});

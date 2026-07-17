import { describe, expect, it } from 'vitest';
import { buildAuthorizeResumeBody } from './authorize-resume-body.server';

describe('buildAuthorizeResumeBody', () => {
  it('overwrites client omniLeadId with server-resolved identity', () => {
    expect(
      buildAuthorizeResumeBody(
        { registrationId: 7, omniLeadId: 'attacker-claim' },
        'omni-session',
      ),
    ).toEqual({ registrationId: 7, omniLeadId: 'omni-session' });
  });

  it('removes client omniLeadId for guest/session-token resume', () => {
    expect(
      buildAuthorizeResumeBody({
        registrationId: 7,
        omniLeadId: 'attacker-claim',
        examSessionToken: 'signed-token',
      }),
    ).toEqual({
      registrationId: 7,
      examSessionToken: 'signed-token',
    });
  });
});

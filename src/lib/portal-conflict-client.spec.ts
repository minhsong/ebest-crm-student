import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';

describe('mapPortalConflictForClient', () => {
  it('maps CRM portal conflict to client-safe payload', () => {
    const result = mapPortalConflictForClient(
      {
        code: 'PORTAL_EMAIL_ALREADY_REGISTERED',
        conflict: { type: 'lead_portal', suggestedAction: 'login_lead' },
      },
      409,
    );
    expect(result.code).toBe('EMAIL_ALREADY_IN_SYSTEM');
    expect(result.action).toBe('login');
    expect(result.message).not.toMatch(/lead|học viên/i);
  });

  it('maps customer_profile to contact_support action', () => {
    const result = mapPortalConflictForClient(
      {
        code: 'PORTAL_EMAIL_ALREADY_REGISTERED',
        conflict: { type: 'customer_profile' },
      },
      409,
    );
    expect(result.action).toBe('contact_support');
  });

  it('maps Google 401 portal registry code to client payload', () => {
    const result = mapPortalConflictForClient(
      {
        message: 'Portal conflict',
        code: 'PORTAL_EMAIL_ALREADY_REGISTERED',
      },
      401,
    );
    expect(result.code).toBe('EMAIL_ALREADY_IN_SYSTEM');
    expect(result.action).toBe('login');
  });

  it('falls back to sanitize for non-conflict errors', () => {
    const result = mapPortalConflictForClient({ message: 'Lỗi khác' }, 400);
    expect(result.code).toBeUndefined();
    expect(result.message).toBe('Lỗi khác');
  });
});

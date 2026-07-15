import { describe, expect, it } from 'vitest';
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
    expect(result.message).not.toMatch(/\blead\b|omniLead|login_key/i);
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

  it('maps phone conflict from Gateway errorCode', () => {
    const result = mapPortalConflictForClient(
      {
        message: 'SĐT đã dùng',
        errorCode: 'PORTAL_PHONE_ALREADY_REGISTERED',
        action: 'login',
      },
      409,
    );
    expect(result.code).toBe('PHONE_ALREADY_IN_SYSTEM');
    expect(result.action).toBe('login');
    expect(result.message).toMatch(/Số điện thoại/i);
  });

  it('maps intake temporarily unavailable', () => {
    const result = mapPortalConflictForClient(
      {
        message: 'internal',
        errorCode: 'INTAKE_TEMPORARILY_UNAVAILABLE',
      },
      503,
    );
    expect(result.code).toBe('INTAKE_TEMPORARILY_UNAVAILABLE');
    expect(result.action).toBe('retry');
    expect(result.message).toMatch(/sự cố tạm thời|thử lại/i);
  });

  it('falls back to sanitize for non-conflict errors', () => {
    const result = mapPortalConflictForClient({ message: 'Lỗi khác' }, 400);
    expect(result.code).toBeUndefined();
    expect(result.message).toBe('Lỗi khác');
  });
});

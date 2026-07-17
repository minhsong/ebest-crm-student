import { describe, expect, it } from 'vitest';
import { parseCustomerOnlineBootstrapContext } from './fetch-customer-bootstrap-context.server';

describe('parseCustomerOnlineBootstrapContext', () => {
  it('parses valid CRM payload', () => {
    expect(
      parseCustomerOnlineBootstrapContext({
        customerId: 42,
        omniLeadId: ' omni-1 ',
        phoneE164: '+84901234567',
        displayName: 'Nguyen Van A',
        email: 'A@Example.COM',
      }),
    ).toEqual({
      customerId: 42,
      omniLeadId: 'omni-1',
      phoneE164: '+84901234567',
      displayName: 'Nguyen Van A',
      email: 'a@example.com',
    });
  });

  it('rejects missing omniLeadId or phone', () => {
    expect(
      parseCustomerOnlineBootstrapContext({
        customerId: 1,
        omniLeadId: '',
        phoneE164: '+8490',
      }),
    ).toBeNull();
    expect(parseCustomerOnlineBootstrapContext(null)).toBeNull();
  });

  it('defaults displayName when empty', () => {
    expect(
      parseCustomerOnlineBootstrapContext({
        customerId: 1,
        omniLeadId: 'x',
        phoneE164: '+8490',
        displayName: '   ',
        email: null,
      }),
    ).toMatchObject({ displayName: 'Học viên', email: null });
  });
});

/**
 * Validation for complete-profile form.
 * Rules aligned with CRM Customer DTO (Length, format).
 */

import type { Rule } from 'antd/es/form';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { FIELD_LIMITS } from './constants';

/** Optional phone: if filled, must be valid and within API length. */
export const validatePhone: Rule['validator'] = (_, value) => {
  if (!value || typeof value !== 'string') return Promise.resolve();
  const v = value.trim();
  if (!v) return Promise.resolve();
  if (v.length > FIELD_LIMITS.primaryPhone) {
    return Promise.reject(new Error(`Số điện thoại tối đa ${FIELD_LIMITS.primaryPhone} ký tự`));
  }
  if (!isValidPhoneNumber(v)) {
    return Promise.reject(new Error('Số điện thoại không hợp lệ'));
  }
  return Promise.resolve();
};

export const formRules = {
  firstName: [
    { required: true, message: 'Vui lòng nhập họ' },
    { max: FIELD_LIMITS.firstName, message: `Họ tối đa ${FIELD_LIMITS.firstName} ký tự` },
  ] as Rule[],
  lastName: [
    { required: true, message: 'Vui lòng nhập tên' },
    { max: FIELD_LIMITS.lastName, message: `Tên tối đa ${FIELD_LIMITS.lastName} ký tự` },
  ] as Rule[],
  primaryEmail: [
    { type: 'email' as const, message: 'Email không hợp lệ' },
    { max: FIELD_LIMITS.primaryEmail, message: `Email tối đa ${FIELD_LIMITS.primaryEmail} ký tự` },
  ] as Rule[],
  primaryPhone: [{ validator: validatePhone }] as Rule[],
  emergencyPhone: [{ validator: validatePhone }] as Rule[],
  facebookUrl: [{ type: 'url' as const, message: 'Link Facebook không hợp lệ' }] as Rule[],
  occupation: [{ max: FIELD_LIMITS.occupation, message: `Tối đa ${FIELD_LIMITS.occupation} ký tự` }] as Rule[],
  emergencyContact: [
    { max: FIELD_LIMITS.emergencyContact, message: `Tối đa ${FIELD_LIMITS.emergencyContact} ký tự` },
  ] as Rule[],
} as const;

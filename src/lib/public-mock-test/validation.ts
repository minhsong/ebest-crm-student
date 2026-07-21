/**
 * Validation form đăng ký thi thử public — đồng bộ giới hạn CRM API.
 */
import type { Rule, RuleObject } from 'antd/es/form';
import { isValidPhoneNumber } from 'libphonenumber-js';

type FormValidator = NonNullable<RuleObject['validator']>;

const LIMITS = {
	displayName: 255,
	primaryEmail: 255,
	primaryPhone: 32,
	universityOther: 200,
	consultationNote: 500,
	expectedScoreMax: 9999,
	expectedScoreMin: 0,
} as const;

export const validateDisplayName: FormValidator = (_, value) => {
	const v = typeof value === 'string' ? value.trim() : '';
	if (!v) {
		return Promise.reject(new Error('Vui lòng nhập họ và tên'));
	}
	if (v.length < 2) {
		return Promise.reject(new Error('Họ tên phải có ít nhất 2 ký tự'));
	}
	if (v.length > LIMITS.displayName) {
		return Promise.reject(
			new Error(`Họ tên tối đa ${LIMITS.displayName} ký tự`),
		);
	}
	return Promise.resolve();
};

export const validatePhoneRequired: FormValidator = (_, value) => {
	if (!value || typeof value !== 'string' || !value.trim()) {
		return Promise.reject(new Error('Vui lòng nhập số điện thoại'));
	}
	const v = value.trim();
	if (v.length > LIMITS.primaryPhone) {
		return Promise.reject(
			new Error(`Số điện thoại tối đa ${LIMITS.primaryPhone} ký tự`),
		);
	}
	if (!isValidPhoneNumber(v)) {
		return Promise.reject(new Error('Số điện thoại không hợp lệ'));
	}
	return Promise.resolve();
};

export const validatePhoneOptional: FormValidator = (_, value) => {
	const v = typeof value === 'string' ? value.trim() : '';
	if (!v) return Promise.resolve();
	if (v.length > LIMITS.primaryPhone) {
		return Promise.reject(
			new Error(`Số điện thoại tối đa ${LIMITS.primaryPhone} ký tự`),
		);
	}
	if (!isValidPhoneNumber(v)) {
		return Promise.reject(new Error('Số điện thoại không hợp lệ'));
	}
	return Promise.resolve();
};

export const publicMockTestFormRules = {
	locationKey: [{ required: true, message: 'Vui lòng chọn cơ sở' }] as Rule[],
	sessionId: [{ required: true, message: 'Vui lòng chọn lịch thi' }] as Rule[],
	displayName: [{ validator: validateDisplayName }] as Rule[],
	primaryPhone: [{ validator: validatePhoneRequired }] as Rule[],
	optionalPhone: [{ validator: validatePhoneOptional }] as Rule[],
	primaryEmail: [
		{ required: true, message: 'Vui lòng nhập email' },
		{ type: 'email' as const, message: 'Email không hợp lệ' },
		{
			max: LIMITS.primaryEmail,
			message: `Email tối đa ${LIMITS.primaryEmail} ký tự`,
		},
		{
			validator: (_, value) => {
				if (typeof value === 'string' && value !== value.trim()) {
					return Promise.reject(
						new Error('Email không được có khoảng trắng đầu/cuối'),
					);
				}
				return Promise.resolve();
			},
		},
	] as Rule[],
	universityOther: [
		{
			max: LIMITS.universityOther,
			message: `Tối đa ${LIMITS.universityOther} ký tự`,
		},
	] as Rule[],
	expectedScore: [
		{
			validator: (_, value) => {
				if (value == null || value === '') return Promise.resolve();
				const n = Number(value);
				if (!Number.isFinite(n)) {
					return Promise.reject(new Error('Điểm kỳ vọng không hợp lệ'));
				}
				const rounded = Math.round(n);
				if (
					rounded < LIMITS.expectedScoreMin ||
					rounded > LIMITS.expectedScoreMax
				) {
					return Promise.reject(
						new Error(
							`Điểm kỳ vọng từ ${LIMITS.expectedScoreMin} đến ${LIMITS.expectedScoreMax}`,
						),
					);
				}
				return Promise.resolve();
			},
		},
	] as Rule[],
};

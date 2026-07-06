import type { Rule } from 'antd/es/form';
import { publicMockTestFormRules } from '@/lib/public-mock-test/validation';

export const leadPortalFormRules = {
  loginId: [
    { required: true, message: 'Vui lòng nhập email hoặc số điện thoại' },
  ] as Rule[],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu' },
    { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
  ] as Rule[],
  registrationId: [
    { required: true, message: 'Vui lòng nhập mã đăng ký' },
    {
      validator: (_: unknown, value: unknown) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1) {
          return Promise.reject(new Error('Mã đăng ký phải là số dương'));
        }
        return Promise.resolve();
      },
    },
  ] as Rule[],
  phone: publicMockTestFormRules.primaryPhone,
  email: publicMockTestFormRules.primaryEmail,
};

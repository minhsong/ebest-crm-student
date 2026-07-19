import type { Rule } from 'antd/es/form';
import { PORTAL_PASSWORD_MIN_LENGTH } from '@ebest/crm-api-types/student/portal';

export { PORTAL_PASSWORD_MIN_LENGTH };

export const portalNewPasswordRules: Rule[] = [
  { required: true, message: 'Vui lòng nhập mật khẩu' },
  {
    min: PORTAL_PASSWORD_MIN_LENGTH,
    message: `Mật khẩu tối thiểu ${PORTAL_PASSWORD_MIN_LENGTH} ký tự`,
  },
];

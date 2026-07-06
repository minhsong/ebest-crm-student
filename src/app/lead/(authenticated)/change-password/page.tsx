import { LeadChangePasswordPageClient } from '@/components/lead-portal/LeadChangePasswordPageClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Đổi mật khẩu',
  description: 'Đổi mật khẩu tài khoản thí sinh thi thử online Ebest English.',
  path: '/lead/change-password',
});

export default function LeadChangePasswordPage() {
  return <LeadChangePasswordPageClient />;
}

import { LeadProfilePageClient } from '@/components/lead-portal/LeadProfilePageClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Thông tin cá nhân',
  description: 'Quản lý hồ sơ tài khoản thí sinh thi thử online.',
  path: '/lead/profile',
});

export default function LeadProfilePage() {
  return <LeadProfilePageClient />;
}

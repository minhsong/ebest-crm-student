import { LeadCompleteProfileClient } from '@/components/lead-portal/LeadCompleteProfileClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Hoàn thiện hồ sơ',
  description: 'Hoàn thiện hồ sơ sau đăng ký để sử dụng cổng thi thử Ebest.',
  path: '/lead/complete-profile',
});

export default function LeadCompleteProfilePage() {
  return <LeadCompleteProfileClient />;
}

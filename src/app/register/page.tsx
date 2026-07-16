import { Suspense } from 'react';
import { LeadCreateAccountClient } from '@/components/lead-portal/LeadCreateAccountClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Đăng ký tài khoản',
  description: 'Tạo tài khoản cổng Ebest để theo dõi thi thử và học tập.',
  path: '/register',
});

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <LeadCreateAccountClient mode="self-serve" />
    </Suspense>
  );
}

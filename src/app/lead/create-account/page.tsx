import { Suspense } from 'react';
import { LeadCreateAccountClient } from '@/components/lead-portal/LeadCreateAccountClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Tạo tài khoản thi thử',
  description: 'Tạo tài khoản lead để theo dõi lịch sử thi thử Ebest.',
  path: '/lead/create-account',
});

export default function LeadCreateAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 px-4 py-10">
      <Suspense fallback={null}>
        <LeadCreateAccountClient />
      </Suspense>
    </div>
  );
}

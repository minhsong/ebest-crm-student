import { LeadMtoResumeClient } from '@/components/lead-portal/LeadMtoResumeClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Tiếp tục đăng ký thi thử',
  description:
    'Xác nhận email để tiếp tục hoàn tất tài khoản và làm bài thi thử.',
  path: '/lead/resume',
});

export default function LeadMtoResumePage() {
  return <LeadMtoResumeClient />;
}

import type { ReactNode } from 'react';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Cổng thí sinh thi thử',
  description:
    'Xem kết quả thi thử TOEIC online trên cổng học viên Ebest English.',
  path: '/lead/tests',
});

export default function LeadLayout({ children }: { children: ReactNode }) {
  return children;
}

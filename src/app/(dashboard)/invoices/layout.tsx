import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Hóa đơn',
  description:
    'Xem và tải hóa đơn – Cổng học viên Ebest English.',
  path: '/invoices',
});

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

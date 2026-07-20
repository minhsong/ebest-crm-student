import { redirect } from 'next/navigation';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/** Không có index `/mock-test/online` — chuyển vào entry bootstrap. */
export default function PortalMockTestOnlineIndexPage() {
  redirect(PORTAL_MOCK_TEST_ROUTES.onlineStart);
}

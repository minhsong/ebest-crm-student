import { redirect } from 'next/navigation';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/** Legacy alias — redirect tới hub results SSOT. */
export default function StudentMockTestResultsPage() {
  redirect(PORTAL_MOCK_TEST_ROUTES.results);
}

import { redirect } from 'next/navigation';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

export const dynamic = 'force-dynamic';

/** Alias legacy → /mock-test/results */
export default async function LeadTestsLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const sp = await searchParams;
  const notice = sp.notice?.trim();
  redirect(
    notice
      ? `${PORTAL_MOCK_TEST_ROUTES.results}?notice=${encodeURIComponent(notice)}`
      : PORTAL_MOCK_TEST_ROUTES.results,
  );
}

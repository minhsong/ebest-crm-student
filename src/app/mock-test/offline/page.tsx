import Link from 'next/link';
import { PageCard, PageHeader } from '@/components/layout';
import { PortalOfflineRegisterForm } from '@/features/portal-mock-test/components/PortalOfflineRegisterForm';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { isLeadMockTestPrincipal } from '@/features/portal-mock-test/identity/types';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';
import {
  PORTAL_MOCK_TEST_API,
  PORTAL_MOCK_TEST_ROUTES,
} from '@/features/portal-mock-test/routes.config';
import { loadPublicMockTestRegisterPageData } from '@/lib/public-mock-test/fetch-public-mock-test.server';
import { parseStudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import { fetchStudentMeForSsr } from '@/lib/server/student-me';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Đăng ký thi tại trung tâm',
  description: 'Đăng ký buổi thi thử offline Ebest English.',
  path: PORTAL_MOCK_TEST_ROUTES.offline,
});

export default async function PortalMockTestOfflinePage() {
  const principal = await resolvePortalMockTestPrincipal();
  assertPortalMockTestAccess(principal, {
    returnUrl: PORTAL_MOCK_TEST_ROUTES.offline,
    capability: 'exam.offline.register',
  });

  const {
    locations,
    profileOptions,
    sessionsError,
    profileOptionsError,
  } = await loadPublicMockTestRegisterPageData();

  let contact: {
    displayName: string;
    primaryPhone: string;
    primaryEmail: string;
  };

  if (principal.actor === 'customer') {
    const me = await fetchStudentMeForSsr();
    const customer = parseStudentMeCustomerBrief(me?.customer);
    contact = {
      displayName: customer?.fullName ?? principal.displayName,
      primaryPhone: customer?.primaryPhone ?? '',
      primaryEmail: customer?.primaryEmail ?? '',
    };
  } else if (isLeadMockTestPrincipal(principal)) {
    contact = {
      displayName: principal.displayName?.trim() || 'Thí sinh',
      primaryPhone: principal.phoneE164 ?? '',
      primaryEmail: principal.email,
    };
  } else {
    contact = {
      displayName: 'Thí sinh',
      primaryPhone: '',
      primaryEmail: '',
    };
  }

  return (
    <>
      <PageHeader
        title="Đăng ký thi tại trung tâm"
        description="Chọn buổi thi tại cơ sở Ebest — dùng thông tin tài khoản đã đăng nhập."
      />
      <PageCard>
        <PortalOfflineRegisterForm
          submitEndpoint={PORTAL_MOCK_TEST_API.offlineRegister}
          initialLocations={locations}
          initialProfileOptions={profileOptions}
          sessionsError={sessionsError}
          profileOptionsError={profileOptionsError}
          contact={contact}
        />
        <div className="mt-4">
          <Link href={PORTAL_MOCK_TEST_ROUTES.hub}>← Về Thi thử</Link>
        </div>
      </PageCard>
    </>
  );
}

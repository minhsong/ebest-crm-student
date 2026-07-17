import { LeadCompleteProfileClient } from '@/components/lead-portal/LeadCompleteProfileClient';
import { buildPageMetadata } from '@/lib/metadata';
import { fetchPublicRegistrationProfileOptions } from '@/lib/public-mock-test/fetch-public-mock-test.server';

export const metadata = buildPageMetadata({
  title: 'Hoàn thiện hồ sơ',
  description: 'Hoàn thiện hồ sơ sau đăng ký để sử dụng cổng thi thử Ebest.',
  path: '/lead/complete-profile',
});

export default async function LeadCompleteProfilePage() {
  const { profileOptions, profileOptionsError } =
    await fetchPublicRegistrationProfileOptions();

  return (
    <LeadCompleteProfileClient
      initialProfileOptions={profileOptions}
      profileOptionsError={profileOptionsError}
    />
  );
}

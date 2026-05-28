import { PublicMockTestRegisterForm } from '@/components/public-mock-test/PublicMockTestRegisterForm';
import { loadPublicMockTestRegisterPageData } from '@/lib/public-mock-test/fetch-public-mock-test.server';

export const dynamic = 'force-dynamic';

/**
 * Trang public — widget form (iframe WordPress).
 * Dữ liệu buổi thi + tag load SSR (CRM_API_URL), không GET qua API route client.
 */
export default async function MockTestRegisterPage() {
	const {
		locations,
		profileOptions,
		sessionsError,
		profileOptionsError,
		initialContact,
	} = await loadPublicMockTestRegisterPageData();

	return (
		<PublicMockTestRegisterForm
			initialLocations={locations}
			initialProfileOptions={profileOptions}
			sessionsError={sessionsError}
			profileOptionsError={profileOptionsError}
			initialContact={initialContact}
		/>
	);
}

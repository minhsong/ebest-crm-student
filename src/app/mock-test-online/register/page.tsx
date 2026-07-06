import { redirect } from 'next/navigation';
import { MockTestOnlineRegisterForm } from '@/components/public-mock-test-online/MockTestOnlineRegisterForm';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { loadMockTestOnlineLeadRegisterPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { getMockTestOnlinePendingLeadId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { redirectLeadRegisterIfAttemptBlocked } from '@/lib/public-mock-test-online/register-attempt-precheck.server';
import { resolveRegisterAttemptStatus } from '@/lib/public-mock-test-online/resolve-register-attempt-status.server';
import {
	fetchMockTestOnlineSeo,
	pickSeoWidgetCopy,
} from '@/lib/public-mock-test-online/seo/fetch-seo.server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';

export const dynamic = 'force-dynamic';

export default async function MockTestOnlineRegisterPage({
	searchParams,
}: {
	searchParams: Promise<{ new?: string }>;
}) {
	const sp = await searchParams;
	const existingLead = getMockTestOnlinePendingLeadId();
	if (existingLead && sp.new !== '1') {
		redirect(
			`/mock-test-online/select-exam?lead=${encodeURIComponent(existingLead)}`,
		);
	}

	const session = await resolvePortalSessionFromCookies();
	let attemptStatus = await resolveRegisterAttemptStatus({
		session,
		pendingLeadId: existingLead || undefined,
	});

	const resumeInExam = Boolean(attemptStatus?.activeInExam?.resumeAllowed);

	// Fast path retake (BL-Q4): lead portal cookie → bootstrap pending — trừ khi đang làm dở.
	if (sp.new !== '1' && session.actor === 'lead' && !resumeInExam) {
		await redirectLeadRegisterIfAttemptBlocked(session.omniLeadId);
		redirect('/api/public/mock-test-online/bootstrap-retake');
	}

	const { profileOptions, profileOptionsError, initialContact } =
		await loadMockTestOnlineLeadRegisterPageData();
	const seo = await fetchMockTestOnlineSeo();
	const widgetCopy = pickSeoWidgetCopy(seo);

	return (
		<>
			<MockTestOnlineSeoJsonLd seo={seo} />
			<MockTestOnlineRegisterForm
				profileOptions={profileOptions}
				profileOptionsError={profileOptionsError}
				initialContact={initialContact}
				widgetTitle={widgetCopy.widgetTitle}
				widgetIntro="Điền thông tin liên hệ để bắt đầu. Sau bước này bạn sẽ chọn bài thi và xác minh qua Zalo."
				attemptStatus={attemptStatus}
				intakeBlocked={resumeInExam}
			/>
		</>
	);
}

import { redirect } from 'next/navigation';
import { MockTestOnlineRegisterForm } from '@/components/public-mock-test-online/MockTestOnlineRegisterForm';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { loadMockTestOnlineLeadRegisterPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { getMockTestOnlineFunnelSessionId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { redirectLeadRegisterIfAttemptBlocked } from '@/lib/public-mock-test-online/register-attempt-precheck.server';
import { resolveRegisterAttemptStatus } from '@/lib/public-mock-test-online/resolve-register-attempt-status.server';
import {
	fetchMockTestOnlineSeo,
} from '@/lib/public-mock-test-online/seo/fetch-seo.server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { fetchGatewayFunnelSession } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';
import { buildMockTestOnlineConfirmExamPath } from '@/lib/public-mock-test-online/select-exam-cache';

export const dynamic = 'force-dynamic';

export default async function MockTestOnlineRegisterPage({
	searchParams,
}: {
	searchParams: Promise<{ new?: string }>;
}) {
	const sp = await searchParams;
	const existingLead = getMockTestOnlineFunnelSessionId();
	if (existingLead && sp.new !== '1') {
		const funnel = await fetchGatewayFunnelSession(existingLead);
		if (
			funnel?.resumeStep === 'verify' &&
			funnel.pendingRegistrationId?.trim()
		) {
			redirect(
				buildMockTestOnlineConfirmExamPath({
					pendingRegistrationId: funnel.pendingRegistrationId.trim(),
					pendingLeadId: funnel.funnelSessionId,
					sessionId: funnel.selectedSessionId ?? undefined,
				}),
			);
		}
		redirect(
			`/mock-test-online/select-exam?lead=${encodeURIComponent(existingLead)}`,
		);
	}

	const session = await resolvePortalSessionFromCookies();
	const attemptStatus = await resolveRegisterAttemptStatus({
		session,
		pendingLeadId: existingLead || undefined,
	});

	const resumeInExam = Boolean(attemptStatus?.activeInExam?.resumeAllowed);

	// Fast path retake (BL-Q4): lead portal cookie → bootstrap pending — trừ khi đang làm dở.
	if (sp.new !== '1' && session.actor === 'lead' && !resumeInExam) {
		await redirectLeadRegisterIfAttemptBlocked(
			session.omniLeadId,
			undefined,
			session.profile.phoneE164,
		);
		redirect('/api/public/mock-test-online/bootstrap-retake');
	}

	const { profileOptions, profileOptionsError, initialContact } =
		await loadMockTestOnlineLeadRegisterPageData();
	const seo = await fetchMockTestOnlineSeo();

	return (
		<>
			<MockTestOnlineSeoJsonLd seo={seo} />
			<MockTestOnlineRegisterForm
				profileOptions={profileOptions}
				profileOptionsError={profileOptionsError}
				initialContact={initialContact}
				widgetTitle="Đăng ký"
				widgetIntro="Điền thông tin liên hệ để bắt đầu. Sau bước này bạn sẽ chọn bài thi và xác minh qua Zalo."
				attemptStatus={attemptStatus}
				intakeBlocked={resumeInExam}
			/>
		</>
	);
}

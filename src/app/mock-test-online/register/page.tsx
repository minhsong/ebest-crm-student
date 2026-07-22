import { redirect } from 'next/navigation';
import { MockTestOnlineRegisterForm } from '@/components/public-mock-test-online/MockTestOnlineRegisterForm';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { loadMockTestOnlineLeadRegisterPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { getMockTestOnlineFunnelSessionId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
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

	// Fast path (BL-Q4): lead / HV portal cookie → hub bootstrap — trừ khi đang làm dở.
	if (
		sp.new !== '1' &&
		(session.actor === 'lead' || session.actor === 'customer') &&
		!resumeInExam
	) {
		redirect('/mock-test/online/start');
	}

	const { initialContact } =
		await loadMockTestOnlineLeadRegisterPageData();
	const seo = await fetchMockTestOnlineSeo();

	return (
		<>
			<MockTestOnlineSeoJsonLd seo={seo} />
			<MockTestClientErrorBoundary variant="funnel">
				<MockTestOnlineRegisterForm
					initialContact={initialContact}
					widgetTitle="Đăng ký"
					widgetIntro="Tiếp tục nhanh bằng Google hoặc đăng ký bằng số điện thoại và xác minh Zalo."
					attemptStatus={attemptStatus}
					intakeBlocked={resumeInExam}
				/>
			</MockTestClientErrorBoundary>
		</>
	);
}

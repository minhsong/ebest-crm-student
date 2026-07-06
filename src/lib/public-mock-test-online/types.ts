import type { PublicRegistrationOptions } from '@/lib/public-mock-test/types';
import type { MockTestOnlineAttemptStatusWire } from '@ebest/crm-api-types/student/mock-test-online';

export type MockTestOnlineCampaign = {
	sessionId: number;

	title: string;

	slug: string;

	testTypeCode: string;

	variantMode: string | null;

	registrationOpensAt: string | null;

	registrationDeadlineAt: string | null;

	estimatedDurationMinutes: number | null;

	marketingBlurb: string | null;

	zaloOaId?: string | null;

};

/** Wire CRM `GET .../attempt-status` — alias package type. */
export type MockTestOnlineAttemptStatus = MockTestOnlineAttemptStatusWire & {
	globalRemaining?: number;
	sessionCap?: MockTestOnlineAttemptStatusWire['sessionCap'];
};

export type MockTestOnlineCampaignsResponse = {
	campaigns: MockTestOnlineCampaign[];

};



/** B1 — chỉ tạo lead. */

export type MockTestOnlineLeadIntakeResponse = {

	pendingLeadId: string;

	omniLeadId: string;

	status: string;

	nextStep: 'select_exam';

	selectExamPath: string;

	message: string;

};



/** B2 — chọn đề + Zalo (giống intake cũ). */

export type MockTestOnlineSelectExamResponse = {

	pendingRegistrationId: string;

	pendingLeadId: string;

	registrationId: number | null;

	sessionId: number;

	status: string;

	zaloOaId?: string;

	zaloOaChatUrl?: string;

	zaloDeepLink: string;

	zaloConfirmMessage?: string;

	pollStatusUrl: string;

	zaloConfirmExpiresAt: string;

	examSessionToken?: string;

	examSessionExpiresAt?: string;

	nextStep: 'zalo_verify';

	message: string;

};



export type MockTestOnlinePollStatus = {

	pendingRegistrationId?: string;

	registrationId: number | null;

	status: string;

	zaloVerifiedAt: string | null;

	examUnlockActive: boolean;

	examUnlockExpiresAt: string | null;

	pollAfterMs: number;

	nextStep?: 'enter_unlock_code' | 'proceed_to_ready';

	examEntryPath?: string;

	autoProceedAvailable?: boolean;

};



export type MockTestOnlineRegisterFormValues = {

	displayName: string;

	primaryPhone: string;

	primaryEmail?: string;

	resultDeliveryEmail?: boolean;

	consentMarketing: boolean;

	tagIds?: number[];

	universityTagId?: number;

	universityOther?: string;

	consultationNote?: string;

	expectedScore?: number;

};



export type MockTestOnlineSelectExamFormValues = {

	pendingLeadId: string;

	sessionId: number;

	testVariantChoice?: 'full' | 'mini';

};



export type MockTestOnlineLeadRegisterPageData = {

	profileOptions: PublicRegistrationOptions | null;

	profileOptionsError: string | null;

	initialContact: {

		displayName?: string;

		primaryPhone?: string;

		primaryEmail?: string;

	} | null;

};



export type MockTestOnlineSelectExamPageData = {

	pendingLeadId: string | null;

	campaigns: MockTestOnlineCampaign[];

	selectedCampaign: MockTestOnlineCampaign | null;

	campaignsError: string | null;

};



export type MockTestOnlineWaitingState = {

	pendingRegistrationId: string;

	zaloDeepLink: string;

	zaloOaChatUrl: string;

	zaloOaId?: string;

	sessionId: number;

	zaloConfirmExpiresAt: string;

	resultDeliveryEmail?: boolean;

};



export type MockTestOnlineVerifyUnlockResponse = {

	verified: boolean;

	registrationId: number;

	sessionId: number;

	status: string;

};



export type MockTestOnlineAuthorizeResponse = {

	allowed: boolean;

	registrationId: number;

	sessionId: number;

	formPublicId: string;

	testFormScoringType: string;

	mode: 'mock_test_public';

	effectiveMaxAttempts: number;

	portalAuthorizeToken?: string;

	portalAuthorizeExpiresAt: string;

	participant: {

		type: 'lead';

		omniLeadId: string;

		registrationId: number;

	};

};



/** @deprecated dùng MockTestOnlineRegisterFormValues */

export type MockTestOnlineFormValues = MockTestOnlineRegisterFormValues & {

	sessionId?: number;

	testVariantChoice?: 'full' | 'mini';

};



/** @deprecated dùng MockTestOnlineLeadIntakeResponse */

export type MockTestOnlineIntakeResponse = MockTestOnlineSelectExamResponse;



/** @deprecated */

export type MockTestOnlineRegisterPageData = MockTestOnlineLeadRegisterPageData & {

	campaigns: MockTestOnlineCampaign[];

	selectedCampaign: MockTestOnlineCampaign | null;

	campaignsError: string | null;

};


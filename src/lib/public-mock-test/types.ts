export interface PublicMockTestSessionItem {
	id: number;
	title: string;
	code: string;
	scheduledStartAt: string;
	scheduledEndAt: string | null;
	capacity: number | null;
	registrationDeadlineAt: string | null;
	classroomName: string | null;
}

export interface PublicLocationGroup {
	locationId: number | null;
	locationName: string;
	locationAddress: string;
	sessions: PublicMockTestSessionItem[];
}

export interface PublicSessionsResponse {
	locations: PublicLocationGroup[];
}

export interface PublicMockTestFormValues {
	locationKey: string;
	sessionId: number;
	displayName: string;
	primaryPhone?: string;
	primaryEmail: string;
	tagsByCategory?: Record<string, number | number[]>;
	universityOther?: string;
	consultationNote?: string;
}

export interface PublicRegistrationTagOption {
	id: number;
	name: string;
	description?: string;
	color?: string;
}

export interface PublicRegistrationTagGroup {
	category: string;
	label: string;
	hint?: string;
	groupColor?: string;
	required: boolean;
	maxSelections: number;
	tags: PublicRegistrationTagOption[];
}

export interface PublicRegistrationOptions {
	groups: PublicRegistrationTagGroup[];
}

export interface PublicRegisterPayload {
	sessionId: number;
	displayName: string;
	primaryPhone: string;
	primaryEmail: string;
	recaptchaToken: string;
	tagIds?: number[];
	universityTagId?: number;
	universityOther?: string;
	consultationNote?: string;
}

export interface PublicRegisterResponse {
	registrationId: number;
	sessionId: number;
	displayName: string;
	status: string;
	warnings?: Array<{ code: string; message: string }>;
	message: string;
}

export interface PublicMergeCandidate {
	key: string;
	source: 'customer' | 'omni_lead';
	displayName: string;
	primaryPhoneMasked: string | null;
	primaryEmailMasked: string | null;
}

export interface PublicMergeRequiredResponse {
	status: 'merge_required';
	mergeToken: string;
	preview: {
		incoming: {
			displayName: string;
			primaryPhone: string;
			primaryEmail: string;
		};
		candidates: PublicMergeCandidate[];
	};
	message: string;
}

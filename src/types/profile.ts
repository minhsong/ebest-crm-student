/**
 * Profile-by-token API types.
 * Contract: ebest-crm-api/docs/modules/customer/CUSTOMER_PROFILE_COMPLETION_LINK.md
 */

export interface ProfileTag {
  id: number;
  name: string;
  color?: string;
  groupKey?: string;
}

export interface ProfileSocialMedia {
  type: string;
  url: string;
  username?: string;
}

export interface ProfileCustomer {
  id: number;
  firstName: string;
  lastName: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gender?: number;
  dateOfBirth?: string;
  occupation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  currentLevel?: string;
  learningGoals?: string[];
  addressData?: Record<string, unknown>;
  additionalContacts?: Array<{ type: string; value: string }>;
  tags?: ProfileTag[];
  socialMedia?: ProfileSocialMedia[];
}

export interface ProfileByTokenResult {
  customer: ProfileCustomer;
  availableTags: ProfileTag[];
}

export interface ProfileByTokenResponse {
  success?: boolean;
  result?: ProfileByTokenResult;
  message?: string;
  code?: number;
}

export interface UpdateProfilePayload {
  token: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gender?: number;
  dateOfBirth?: string;
  occupation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  tagIds?: number[];
  socialMedia?: Array<{ type: string; url: string; username?: string }>;
}

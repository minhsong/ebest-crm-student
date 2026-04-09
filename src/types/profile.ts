/**
 * Profile-by-token API types.
 * Contract: ebest-crm-api/docs/modules/customer/CUSTOMER_PROFILE_COMPLETION_LINK.md
 */

/** Địa chỉ (2 cấp: province, ward) – dùng chung cho customer/addressData và payload. */
export interface ProfileAddressData {
  streetAddress?: string;
  province?: { name: string; codename: string };
  ward?: { name: string; codename: string };
  country?: { name: string; codename: string };
  postalCode?: string;
}

export interface ProfileTag {
  id: number;
  name: string;
  color?: string;
  groupKey?: string;
  groupName?: string;
  groupColor?: string;
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
  nickname?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gender?: number;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyContactRelationship?: string;
  emergencyPhone?: string;
  currentLevel?: string;
  learningGoals?: string[];
  identityCardNumber?: string;
  addressData?: ProfileAddressData;
  additionalContacts?: Array<{ type: string; value: string }>;
  tags?: ProfileTag[];
  socialMedia?: ProfileSocialMedia[];
  /** Đã có tài khoản đăng nhập cổng học viên (email/SĐT + mật khẩu hoặc tương đương). */
  portalAccountCreated?: boolean;
  /**
   * Đã hoàn tất các bước thông tin tới địa chỉ/CCCD; có thể chỉ còn bước đặt mật khẩu.
   */
  profileDataComplete?: boolean;
  /**
   * @deprecated Cùng nghĩa `portalAccountCreated` — giữ để tương thích.
   * true = đã có tài khoản đăng nhập (redirect về login).
   */
  confirmed?: boolean;
}

export interface ProfileByTokenResult {
  customer: ProfileCustomer;
  availableTags: ProfileTag[];
}

export interface ProfileByTokenResponse {
  success?: boolean;
  /** CRM API returns profile in `data` */
  data?: ProfileByTokenResult;
  /** Legacy/fallback; code reads payload from data ?? result */
  result?: ProfileByTokenResult;
  message?: string;
  code?: number;
}

export interface UpdateProfilePayload {
  token: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gender?: number;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyContactRelationship?: string;
  emergencyPhone?: string;
  identityCardNumber?: string;
  addressData?: ProfileAddressData;
  tagIds?: number[];
  socialMedia?: Array<{ type: string; url: string; username?: string }>;
}

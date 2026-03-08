/**
 * Build PATCH payload for profile-by-token from form values.
 * Typed and aligned with UpdateProfilePayload / CRM API.
 */

import type { Dayjs } from 'dayjs';
import type { UpdateProfilePayload } from '@/types/profile';

function trimOrUndefined(s: unknown): string | undefined {
  if (s == null || typeof s !== 'string') return undefined;
  const t = s.trim();
  return t === '' ? undefined : t;
}

const SOCIAL_TYPES = ['facebook', 'zalo'] as const;

export interface AddressFormValue {
  streetAddress?: string;
  provinceCode?: number;
  provinceName?: string;
  provinceCodename?: string;
  wardCode?: number;
  wardName?: string;
  wardCodename?: string;
}

export interface ProfileFormValues {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  dateOfBirth?: Dayjs;
  identityCardNumber?: string;
  streetAddress?: string;
  provinceCode?: number;
  provinceName?: string;
  provinceCodename?: string;
  wardCode?: number;
  wardName?: string;
  wardCodename?: string;
  emergencyContact?: string;
  emergencyContactRelationship?: string;
  emergencyPhone?: string;
  facebookUrl?: string;
  zaloUrl?: string;
  termsAccepted?: boolean;
}

export function buildProfilePayload(
  token: string,
  values: ProfileFormValues,
  selectedTagIds: number[]
): UpdateProfilePayload {
  const socialMedia = SOCIAL_TYPES.reduce<UpdateProfilePayload['socialMedia']>(
    (acc, type) => {
      const url = trimOrUndefined(values[type === 'facebook' ? 'facebookUrl' : 'zaloUrl']);
      if (url) acc = [...(acc ?? []), { type, url }];
      return acc;
    },
    undefined
  );

  const streetAddress = trimOrUndefined(values.streetAddress);
  const hasProvince = values.provinceName && values.provinceCodename;
  const hasWard = values.wardName && values.wardCodename;
  const addressData =
    streetAddress || hasProvince || hasWard
      ? {
          streetAddress: streetAddress ?? undefined,
          province: hasProvince
            ? { name: values.provinceName!, codename: values.provinceCodename! }
            : undefined,
          ward: hasWard
            ? { name: values.wardName!, codename: values.wardCodename! }
            : undefined,
          country:
            hasProvince || hasWard
              ? { name: 'Việt Nam', codename: 'viet_nam' }
              : undefined,
        }
      : undefined;

  return {
    token,
    firstName: trimOrUndefined(values.firstName),
    lastName: trimOrUndefined(values.lastName),
    nickname: trimOrUndefined(values.nickname),
    primaryEmail: trimOrUndefined(values.primaryEmail),
    primaryPhone: trimOrUndefined(values.primaryPhone),
    dateOfBirth: values.dateOfBirth
      ? values.dateOfBirth.format('YYYY-MM-DD')
      : undefined,
    identityCardNumber: trimOrUndefined(values.identityCardNumber),
    addressData,
    emergencyContact: trimOrUndefined(values.emergencyContact),
    emergencyContactRelationship: trimOrUndefined(values.emergencyContactRelationship),
    emergencyPhone: trimOrUndefined(values.emergencyPhone),
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    socialMedia: socialMedia && socialMedia.length > 0 ? socialMedia : undefined,
  };
}

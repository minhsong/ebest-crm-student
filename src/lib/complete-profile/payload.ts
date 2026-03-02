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

export interface ProfileFormValues {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  dateOfBirth?: Dayjs;
  emergencyContact?: string;
  emergencyContactRelationship?: string;
  emergencyPhone?: string;
  facebookUrl?: string;
  zaloUrl?: string;
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
    emergencyContact: trimOrUndefined(values.emergencyContact),
    emergencyContactRelationship: trimOrUndefined(values.emergencyContactRelationship),
    emergencyPhone: trimOrUndefined(values.emergencyPhone),
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    socialMedia: socialMedia && socialMedia.length > 0 ? socialMedia : undefined,
  };
}

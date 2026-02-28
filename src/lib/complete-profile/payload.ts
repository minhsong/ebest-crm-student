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
  primaryEmail?: string;
  primaryPhone?: string;
  dateOfBirth?: Dayjs;
  occupation?: string;
  emergencyContact?: string;
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
    primaryEmail: trimOrUndefined(values.primaryEmail),
    primaryPhone: trimOrUndefined(values.primaryPhone),
    dateOfBirth: values.dateOfBirth
      ? values.dateOfBirth.format('YYYY-MM-DD')
      : undefined,
    occupation: trimOrUndefined(values.occupation),
    emergencyContact: trimOrUndefined(values.emergencyContact),
    emergencyPhone: trimOrUndefined(values.emergencyPhone),
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    socialMedia: socialMedia && socialMedia.length > 0 ? socialMedia : undefined,
  };
}

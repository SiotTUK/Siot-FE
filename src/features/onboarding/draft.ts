import type {
  MemberResponse,
  Residence,
  StayPurpose,
  UserType,
} from '@/shared/api/types'

export const userTypes = ['NEW', 'LIVING'] as const satisfies UserType[]
export const stayPurposes = [
  'STUDY',
  'WORK',
  'FAMILY',
  'OTHER',
] as const satisfies StayPurpose[]
export const residenceOptions = [
  'KIDS',
  'CAR',
  'HOUSE',
  'KOREAN',
  'F4',
] as const satisfies Residence[]

/** Answers collected across F02~F06 and saved once at F06. */
export interface OnboardingDraft {
  userType: UserType | null
  entryDate: string | null
  purpose: StayPurpose | null
  residences: Residence[]
  stayExpiry: string | null
}

/** PUT /api/members/me/onboarding — always overwrites all five answers. */
export interface OnboardingRequest {
  userType: UserType
  entryDate: string | null
  purpose: StayPurpose | null
  residences: Residence[]
  stayExpiry: string | null
}

export const emptyDraft: OnboardingDraft = {
  userType: null,
  entryDate: null,
  purpose: null,
  residences: [],
  stayExpiry: null,
}

/** YYYY-MM-DD that is also a real calendar date. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function oneOf<T extends string>(
  values: readonly T[],
  value: unknown,
): T | null {
  return values.includes(value as T) ? (value as T) : null
}

/** Reads a stored draft defensively; anything unexpected is dropped. */
export function parseDraft(value: unknown): OnboardingDraft {
  if (!value || typeof value !== 'object') return emptyDraft
  const raw = value as Record<string, unknown>
  const residences: unknown[] = Array.isArray(raw.residences)
    ? raw.residences
    : []
  return {
    userType: oneOf(userTypes, raw.userType),
    entryDate: isIsoDate(raw.entryDate) ? raw.entryDate : null,
    purpose: oneOf(stayPurposes, raw.purpose),
    residences: residenceOptions.filter((option) =>
      residences.includes(option),
    ),
    stayExpiry: isIsoDate(raw.stayExpiry) ? raw.stayExpiry : null,
  }
}

/** Skipped answers are sent as null / [] so the server clears them. */
export function toOnboardingRequest(
  draft: OnboardingDraft,
): OnboardingRequest | undefined {
  if (!draft.userType) return undefined
  return {
    userType: draft.userType,
    entryDate: draft.entryDate,
    purpose: draft.purpose,
    residences: residenceOptions.filter((option) =>
      draft.residences.includes(option),
    ),
    stayExpiry: draft.stayExpiry,
  }
}

/**
 * M10 edit: PUT overwrites all five answers, so start from what is saved and
 * change only `patch`. Leaving a field out would erase it on the server.
 */
export function requestFromMember(
  member: Pick<
    MemberResponse,
    'userType' | 'entryDate' | 'purpose' | 'residences' | 'stayExpiry'
  >,
  patch: Partial<OnboardingRequest> = {},
): OnboardingRequest | undefined {
  return toOnboardingRequest({
    userType: member.userType,
    entryDate: member.entryDate,
    purpose: member.purpose,
    residences: member.residences,
    stayExpiry: member.stayExpiry,
    ...patch,
  })
}

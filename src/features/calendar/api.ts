import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

export interface ScheduleResponse {
  scheduleId: number | null
  guideId: number | null
  kind: string
  title: string
  startsOn: string
  endsOn: string | null
  targetDescription: string | null
  sourceUrl: string | null
  personal: boolean
  highlighted: boolean
  /** Days left to the end (or start) date, Korea time. Server-computed. */
  dDay?: number | null
  /**
   * Common tax schedule to open in the tax detail (BE #29): its own id for a
   * common tax, the matching round for a personal TAX_CAR·TAX_PROPERTY.
   * null → no detail. Older responses may leave it out.
   */
  taxScheduleId?: number | null
}

/** CAL-03 tax detail (GET /api/schedules/taxes/{id}). */
export interface TaxDetailResponse {
  scheduleId: number
  guideId: number | null
  /** TAX_CAR, TAX_PROPERTY, TAX_RESIDENT ... */
  kind: string
  title: string
  startsOn: string
  endsOn: string | null
  targetDescription: string | null
  sourceUrl: string | null
  summary: string | null
  content: string | null
  place: string | null
  docs: string[] | null
  fee: string | null
  law: string | null
  penalty: string | null
  /** Office and number in the requested language (BE #29); null → hide. */
  contact: string | null
  sourcePages: string | null
  dDay: number | null
}

export const taxKeys = {
  all: ['taxes'] as const,
  detail: (scheduleId: number, language: Language) =>
    [...taxKeys.all, 'detail', scheduleId, language] as const,
  schedule: (scheduleId: number, language: Language) =>
    [...taxKeys.all, 'schedule', scheduleId, language] as const,
  byKind: (kind: string, language: Language) =>
    [...taxKeys.all, 'kind', kind, language] as const,
}

export function fetchTaxDetail(
  scheduleId: number,
  language: Language,
  signal?: AbortSignal,
) {
  return apiRequest<TaxDetailResponse>(
    `/api/schedules/taxes/${scheduleId}?language=${language}`,
    { signal },
  )
}

/** Common tax schedules of one kind, by start date (GET /api/schedules/taxes?kind=). */
export function fetchTaxSchedules(
  kind: string,
  language: Language,
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({ kind, language })
  return apiRequest<TaxDetailResponse[]>(`/api/schedules/taxes?${search}`, {
    signal,
  })
}

export const scheduleQueryKey = ['schedules'] as const
export const memberScheduleQueryKey = (memberId: number) =>
  [...scheduleQueryKey, memberId] as const

export function fetchMonthlySchedules(
  year: number,
  month: number,
  language: Language,
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({
    year: String(year),
    month: String(month),
    language,
  })
  return apiRequest<ScheduleResponse[]>(`/api/schedules/monthly?${search}`, {
    signal,
  })
}

/**
 * CAL-03 schedule detail (GET /api/schedules/{id}). The BE answers with the
 * same shape as the tax detail, for any common schedule (#34).
 */
export function fetchScheduleDetail(
  scheduleId: number,
  language: Language,
  signal?: AbortSignal,
) {
  return apiRequest<TaxDetailResponse>(
    `/api/schedules/${scheduleId}?language=${language}`,
    { signal },
  )
}

/**
 * CAL-01 common schedules of a year by start date, with the member's own
 * schedules added like the monthly API (SiotTUK/Siot-BE#28).
 */
export function fetchYearlySchedules(
  year: number,
  language: Language,
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({ year: String(year), language })
  return apiRequest<ScheduleResponse[]>(`/api/schedules/yearly?${search}`, {
    signal,
  })
}

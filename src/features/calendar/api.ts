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

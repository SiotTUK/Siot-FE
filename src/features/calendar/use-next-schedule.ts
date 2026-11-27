import { useQuery } from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import { fetchYearlySchedules, memberScheduleQueryKey } from './api'
import { nextSchedule } from './calendar'
import { lastCalendarMonth } from './calendar-location'

function useYearlySchedules(
  memberId: number,
  year: number,
  language: Language,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...memberScheduleQueryKey(memberId), 'yearly', year, language],
    queryFn: ({ signal }) => fetchYearlySchedules(year, language, signal),
    enabled,
  })
}

/**
 * "다음 할 일" for a month without schedules (#34): the first schedule that
 * starts after `month` (YYYY-MM), from the yearly API of that year and, when
 * the rest of the year is empty, the next one. Only asked when `enabled`.
 */
export function useNextSchedule(
  memberId: number,
  month: string,
  language: Language,
  enabled: boolean,
) {
  const year = Number(month.slice(0, 4))
  const thisYear = useYearlySchedules(memberId, year, language, enabled)
  const inThisYear = thisYear.data && nextSchedule(thisYear.data, month)
  const nextYear = useYearlySchedules(
    memberId,
    year + 1,
    language,
    enabled &&
      thisYear.isSuccess &&
      !inThisYear &&
      String(year + 1) <= lastCalendarMonth.slice(0, 4),
  )
  return inThisYear ?? (nextYear.data && nextSchedule(nextYear.data, month))
}

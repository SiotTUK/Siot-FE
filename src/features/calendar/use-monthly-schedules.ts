import { useQuery } from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import { fetchMonthlySchedules, memberScheduleQueryKey } from './api'

export function useMonthlySchedules(
  memberId: number,
  year: number,
  month: number,
  language: Language,
) {
  return useQuery({
    queryKey: [...memberScheduleQueryKey(memberId), year, month, language],
    queryFn: ({ signal }) =>
      fetchMonthlySchedules(year, month, language, signal),
  })
}

import { useQuery } from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import {
  fetchScheduleDetail,
  fetchTaxDetail,
  fetchTaxSchedules,
  taxKeys,
} from './api'

/**
 * CAL-03 detail of a common schedule: `tax` reads the tax detail
 * (`/taxes/{id}`), `schedule` the schedule detail (`/{id}`, #34). Both answer
 * with the same shape.
 */
export function useTaxDetail(
  scheduleId: number,
  language: Language,
  source: 'tax' | 'schedule' = 'tax',
  enabled = true,
) {
  return useQuery({
    queryKey:
      source === 'tax'
        ? taxKeys.detail(scheduleId, language)
        : taxKeys.schedule(scheduleId, language),
    queryFn: ({ signal }) =>
      source === 'tax'
        ? fetchTaxDetail(scheduleId, language, signal)
        : fetchScheduleDetail(scheduleId, language, signal),
    enabled,
  })
}

/** Rounds of one tax kind; disabled without a kind (not a tax rule). */
export function useTaxSchedules(kind: string | undefined, language: Language) {
  return useQuery({
    queryKey: taxKeys.byKind(kind ?? '', language),
    queryFn: ({ signal }) => fetchTaxSchedules(kind ?? '', language, signal),
    enabled: kind !== undefined,
  })
}

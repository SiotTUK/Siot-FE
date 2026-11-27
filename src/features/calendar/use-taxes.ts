import { useQuery } from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import { fetchTaxDetail, fetchTaxSchedules, taxKeys } from './api'

export function useTaxDetail(scheduleId: number, language: Language) {
  return useQuery({
    queryKey: taxKeys.detail(scheduleId, language),
    queryFn: ({ signal }) => fetchTaxDetail(scheduleId, language, signal),
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

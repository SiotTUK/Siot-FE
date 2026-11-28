import { useQuery } from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import { fetchMonthlyTodos, monthlyTodosQueryKey } from './api'

export function useMonthlyTodos(memberId: number, language: Language) {
  return useQuery({
    queryKey: monthlyTodosQueryKey(memberId, language),
    queryFn: ({ signal }) => fetchMonthlyTodos(language, signal),
  })
}

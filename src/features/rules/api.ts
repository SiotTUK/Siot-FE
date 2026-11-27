import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

/**
 * The part of `GET /api/rules/{code}` the FE reads today. The screen text
 * still comes from the FE content until the rules move to the API (#42).
 */
export interface RuleApiResponse {
  code: string
  /**
   * RUL-06 tax kind (BE #29): TAX_CAR · TAX_PROPERTY · TAX_RESIDENT, null
   * for other rules. Finds the tax detail with `GET /api/schedules/taxes?kind=`.
   */
  taxKind: string | null
}

export const ruleKeys = {
  all: ['rules'] as const,
  detail: (code: string, language: Language) =>
    [...ruleKeys.all, 'detail', code, language] as const,
}

export function fetchRule(
  code: string,
  language: Language,
  signal?: AbortSignal,
) {
  return apiRequest<RuleApiResponse>(
    `/api/rules/${encodeURIComponent(code)}?language=${language}`,
    { signal },
  )
}

/**
 * Tax kind of a rule from the BE (`taxKind`). undefined while loading, on
 * error, or when the BE does not know the code; null for a non-tax rule.
 */
export function useRuleTaxKind(code: string, language: Language) {
  const query = useQuery({
    queryKey: ruleKeys.detail(code, language),
    queryFn: ({ signal }) => fetchRule(code, language, signal),
    retry: false,
  })
  return query.data?.taxKind
}

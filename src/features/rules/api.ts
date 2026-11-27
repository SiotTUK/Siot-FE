import { useQuery } from '@tanstack/react-query'
import { ApiError, apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

/**
 * The part of the BE `RuleResponse` the screens read (SiotTUK/Siot-BE#14).
 * Text fields are in the requested language, or Korean when that language
 * has no text yet (`translated: false`).
 */
export interface RuleResponse {
  /** URL slug, e.g. `waste-food`. */
  code: string
  /** FE category key (order, waste, …); null for a category an admin added. */
  categoryKey: string | null
  title: string
  summary: string | null
  /** Checked statements shown as the body, in order. */
  points: string[]
  when: string | null
  place: string | null
  fee: string | null
  penalty: string | null
  law: string | null
  contact: string | null
  /** Official pages the text was checked against (Korean page titles). */
  sources: { name: string; url: string }[]
  /** YYYY-MM-DD the text was checked against the sources. */
  checkedOn: string | null
  /** false → Korean text shown: "번역 준비 중" (COM-02). */
  translated: boolean
  /**
   * RUL-06 tax kind (BE #29): TAX_CAR · TAX_PROPERTY · TAX_RESIDENT, null
   * for other rules. Finds the tax detail with `GET /api/schedules/taxes?kind=`.
   */
  taxKind: string | null
}

/** RUL-04 자주 묻는 질문 (`GET /api/rules/faq`), in order. */
export interface RuleFaqResponse {
  sortOrder: number
  question: string
  answer: string
  /** Rule to open for details; null when that rule was deleted. */
  ruleCode: string | null
  ruleTitle: string | null
  /** Language of question and answer (ko when the requested one is missing). */
  language: Language
}

export const ruleKeys = {
  all: ['rules'] as const,
  list: (language: Language) => [...ruleKeys.all, 'list', language] as const,
  faqs: (language: Language) => [...ruleKeys.all, 'faqs', language] as const,
  detail: (code: string, language: Language) =>
    [...ruleKeys.all, 'detail', code, language] as const,
}

/** Every rule, in category order then the order inside each category. */
export function fetchRules(language: Language, signal?: AbortSignal) {
  return apiRequest<RuleResponse[]>(`/api/rules?language=${language}`, {
    signal,
  })
}

export function fetchRuleFaqs(language: Language, signal?: AbortSignal) {
  return apiRequest<RuleFaqResponse[]>(`/api/rules/faq?language=${language}`, {
    signal,
  })
}

/** One rule. A deleted or unknown code answers 404 `GUIDE_NOT_FOUND`. */
export function fetchRule(
  code: string,
  language: Language,
  signal?: AbortSignal,
) {
  return apiRequest<RuleResponse>(
    `/api/rules/${encodeURIComponent(code)}?language=${language}`,
    { signal },
  )
}

export function useRuleListQuery(language: Language) {
  return useQuery({
    queryKey: ruleKeys.list(language),
    queryFn: ({ signal }) => fetchRules(language, signal),
  })
}

export function useRuleFaqQuery(language: Language) {
  return useQuery({
    queryKey: ruleKeys.faqs(language),
    queryFn: ({ signal }) => fetchRuleFaqs(language, signal),
  })
}

export function useRuleQuery(code: string, language: Language) {
  return useQuery({
    queryKey: ruleKeys.detail(code, language),
    queryFn: ({ signal }) => fetchRule(code, language, signal),
    enabled: code.length > 0,
  })
}

/** 404 `GUIDE_NOT_FOUND`: the code is unknown or the rule was deleted. */
export function isRuleNotFound(error: unknown) {
  return error instanceof ApiError && error.code === 'GUIDE_NOT_FOUND'
}

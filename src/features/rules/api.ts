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
  /** Korean original category name (list filter value). */
  category?: string | null
  /** Category name in the requested language (RUL-13); Korean if untranslated. */
  categoryName?: string | null
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
   * NTF-07 when an admin last saved the rule as a real change (deadline,
   * place, fee…), e.g. `2026-11-28T10:00:00+09:00`; null = never. Rules send
   * no change notification; the detail screen shows "안내 변경" with this date.
   */
  noticeChangedAt: string | null
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

/** RUL-12·13 member rule category (`GET /api/rules/categories?language=`). */
export interface RuleCategoryResponse {
  /** Korean original name; also accepted as the `category` filter value. */
  category: string
  /** Name in the requested language, or Korean when `translated` is false. */
  name: string
  /** false → Korean original shown ("번역 준비 중"). */
  translated: boolean
  /** Built-in FE key (order, waste, …); null for admin-added categories. */
  key: string | null
  sortOrder: number
}

export const ruleKeys = {
  all: ['rules'] as const,
  categories: (language: Language) =>
    [...ruleKeys.all, 'categories', language] as const,
  list: (language: Language) => [...ruleKeys.all, 'list', language] as const,
  faqs: (language: Language) => [...ruleKeys.all, 'faqs', language] as const,
  detail: (code: string, language: Language) =>
    [...ruleKeys.all, 'detail', code, language] as const,
}

export function fetchRuleCategories(language: Language, signal?: AbortSignal) {
  return apiRequest<RuleCategoryResponse[]>(
    `/api/rules/categories?language=${language}`,
    { signal },
  )
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

export function useRuleCategoriesQuery(language: Language) {
  return useQuery({
    queryKey: ruleKeys.categories(language),
    queryFn: ({ signal }) => fetchRuleCategories(language, signal),
  })
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

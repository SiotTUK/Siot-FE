import { apiRequest } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'

/** ADM-06 list row (`GET /api/admin/rules`). `title` is the Korean text. */
export interface AdminRuleSummary {
  code: string
  /** Korean category name (also the filter value). */
  category: string
  title: string
  sortOrder: number
  faq: boolean
  deleted: boolean
  deletedAt: string | null
  updatedAt: string | null
  noticeChangedAt: string | null
  /** en/zh/vi that have text, and those still missing (auto-translation failed). */
  translatedLanguages: Language[]
  missingLanguages: Language[]
}

export interface RuleSource {
  name: string
  url: string
}

/**
 * ADM-06 `GET /api/admin/rules/{code}`: the Korean source text of a rule (the
 * BE `RuleResponse`, also returned by create and update). Deleted rules can
 * be read but not changed.
 */
export interface AdminRuleDetail {
  code: string
  category: string
  title: string
  summary: string | null
  content: string | null
  badge: string | null
  place: string | null
  docs: string[]
  fee: string | null
  law: string | null
  penalty: string | null
  contact: string | null
  sourceUrl: string | null
  sourceName: string | null
  sortOrder: number
  faq: boolean
  noticeChangedAt: string | null
  points: string[]
  when: string | null
  sources: RuleSource[]
  /** YYYY-MM-DD */
  checkedOn: string | null
}

/** Fields shared by create (RuleCreateRequest) and update (RuleUpdateRequest). */
interface RuleBody {
  category: string
  sortOrder: number
  faq: boolean
  title: string
  summary: string | null
  /** null → the BE fills it from `points`, one per line. */
  content: string | null
  badge: string | null
  place: string | null
  docs: string[]
  fee: string | null
  law: string | null
  penalty: string | null
  /** "" clears it. */
  contact: string
  sourceName: string | null
  points: string[]
  when: string | null
  /** Replaces the list; the first link becomes the item's source link. */
  sources: RuleSource[]
  checkedOn: string | null
}

export interface RuleCreateRequest extends RuleBody {
  code: string
}

export interface RuleUpdateRequest extends RuleBody {
  /** true = real guidance change: members get a change notice (NTF-07). */
  noticeChanged: boolean
}

/** RUL-12·13 category with its rule count and en/zh/vi names. */
export interface AdminRuleCategory {
  category: string
  ruleCount: number
  translations: Partial<Record<Exclude<Language, 'ko'>, string>>
}

export interface RuleFaqText {
  question: string
  answer: string
}

/** RUL-04 FAQ written by an admin (`/api/admin/rule-faqs`). */
export interface AdminRuleFaq {
  faqId: number
  sortOrder: number
  ruleCode: string | null
  ruleTitle: string | null
  /** The linked rule was deleted: members see the FAQ without the link. */
  ruleDeleted: boolean
  translations: Partial<Record<Language, RuleFaqText>>
}

/** Replaces the whole FAQ; languages left out are removed. `ko` is required. */
export interface RuleFaqRequest {
  sortOrder: number
  /** "" = no linked rule. */
  ruleCode: string
  translations: Partial<Record<Language, RuleFaqText>> & { ko: RuleFaqText }
}

export interface AdminRuleFilters {
  category: string
  keyword: string
  includeDeleted: boolean
}

export const adminRuleKeys = {
  all: ['admin', 'rules'] as const,
  list: (filters: AdminRuleFilters) =>
    [...adminRuleKeys.all, 'list', filters] as const,
  detail: (code: string) => [...adminRuleKeys.all, 'detail', code] as const,
  categories: () => [...adminRuleKeys.all, 'categories'] as const,
  faqs: () => [...adminRuleKeys.all, 'faqs'] as const,
}

const enc = encodeURIComponent

export function fetchAdminRules({
  category,
  keyword,
  includeDeleted,
}: AdminRuleFilters) {
  const search = new URLSearchParams()
  if (category) search.set('category', category)
  if (keyword.trim()) search.set('keyword', keyword.trim())
  if (includeDeleted) search.set('includeDeleted', 'true')
  const query = search.toString()
  return apiRequest<AdminRuleSummary[]>(
    `/api/admin/rules${query ? `?${query}` : ''}`,
  )
}

export function fetchAdminRule(code: string) {
  return apiRequest<AdminRuleDetail>(`/api/admin/rules/${enc(code)}`)
}

export function createRule(body: RuleCreateRequest) {
  return apiRequest<AdminRuleDetail>('/api/admin/rules', {
    method: 'POST',
    body,
  })
}

export function updateRule(code: string, body: RuleUpdateRequest) {
  return apiRequest<AdminRuleDetail>(`/api/admin/rules/${enc(code)}`, {
    method: 'PUT',
    body,
  })
}

export function deleteRule(code: string) {
  return apiRequest(`/api/admin/rules/${enc(code)}`, { method: 'DELETE' })
}

export function fetchRuleCategories() {
  return apiRequest<AdminRuleCategory[]>('/api/admin/rule-categories')
}

/** Moves every rule of `category` to `name` (merges into it if it exists). */
export function renameRuleCategory(category: string, name: string) {
  return apiRequest<AdminRuleCategory>(
    `/api/admin/rule-categories/${enc(category)}`,
    { method: 'PUT', body: { name } },
  )
}

export function saveRuleCategoryTranslation(
  category: string,
  language: Exclude<Language, 'ko'>,
  name: string,
) {
  return apiRequest<AdminRuleCategory>(
    `/api/admin/rule-categories/${enc(category)}/translations/${language}`,
    { method: 'PUT', body: { name } },
  )
}

export function fetchRuleFaqs() {
  return apiRequest<AdminRuleFaq[]>('/api/admin/rule-faqs')
}

export function createRuleFaq(body: RuleFaqRequest) {
  return apiRequest<AdminRuleFaq>('/api/admin/rule-faqs', {
    method: 'POST',
    body,
  })
}

export function updateRuleFaq(faqId: number, body: RuleFaqRequest) {
  return apiRequest<AdminRuleFaq>(`/api/admin/rule-faqs/${faqId}`, {
    method: 'PUT',
    body,
  })
}

export function deleteRuleFaq(faqId: number) {
  return apiRequest(`/api/admin/rule-faqs/${faqId}`, { method: 'DELETE' })
}

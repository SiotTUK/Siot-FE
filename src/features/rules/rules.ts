import type { Language } from '@/shared/api/types'

/**
 * 생활 수칙 is fixed guide text kept in the FE (team decision 2026-11-25):
 * every entry is checked against the official pages in `sources`.
 */
export type Localized = Record<Language, string>

/** Figma M06 order: 기초 질서 · 쓰레기 · 교통 · 세금 · 생활 편의 · 교육·상담 */
export const ruleCategories = [
  'order',
  'waste',
  'traffic',
  'tax',
  'living',
  'support',
] as const
export type RuleCategory = (typeof ruleCategories)[number]

export const factKeys = [
  'when',
  'where',
  'fee',
  'penalty',
  'law',
  'contact',
] as const
export type FactKey = (typeof factKeys)[number]

export interface RuleEntry {
  /** URL slug, e.g. `waste-bags` (not the BE RUL-xx ids). */
  code: string
  category: RuleCategory
  title: Localized
  summary: Localized
  /** Short checked statements shown as the body. */
  points: Localized[]
  facts?: Partial<Record<FactKey, Localized>>
  /** Official pages the text was checked against (Korean page titles). */
  sources: { name: string; url: string }[]
}

export interface RuleFaq {
  question: Localized
  answer: Localized
  /** The rule to open for details. */
  rule: string
}

/** One language's view of a rule, as the screens use it. */
export interface Rule {
  code: string
  category: RuleCategory
  title: string
  summary: string
  points: string[]
  facts: { key: FactKey; value: string }[]
  sources: { name: string; url: string }[]
}

export function localizeRule(entry: RuleEntry, language: Language): Rule {
  return {
    code: entry.code,
    category: entry.category,
    title: entry.title[language],
    summary: entry.summary[language],
    points: entry.points.map((point) => point[language]),
    facts: factKeys.flatMap((key) => {
      const value = entry.facts?.[key]?.[language]
      return value ? [{ key, value }] : []
    }),
    sources: entry.sources,
  }
}

export interface RuleGroup {
  category: RuleCategory
  rules: Rule[]
}

/** "분야별 안내": one group per category in the Figma order, empty ones skipped. */
export function groupByCategory(rules: Rule[]): RuleGroup[] {
  return ruleCategories
    .map((category) => ({
      category,
      rules: rules.filter((rule) => rule.category === category),
    }))
    .filter((group) => group.rules.length > 0)
}

/** Matches every word of the query against the title, summary and body. */
export function searchRules(rules: Rule[], query: string) {
  const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return rules
  return rules.filter((rule) => {
    const text = [rule.title, rule.summary, ...rule.points]
      .join(' ')
      .toLocaleLowerCase()
    return words.every((word) => text.includes(word))
  })
}

/** Only http(s) links are shown as links. */
export function safeUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null
  } catch {
    return null
  }
}

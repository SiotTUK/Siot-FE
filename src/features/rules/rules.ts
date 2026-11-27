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
  /** The penalty includes a fine (shown as a "과태료 있음" tag). */
  fine: boolean
}

export function localizeRule(entry: RuleEntry, language: Language): Rule {
  return {
    code: entry.code,
    category: entry.category,
    fine: hasFine(entry),
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

/** Korean phone numbers as written in the rule contacts: 031-310-2254, 1661-2642, 1345. */
const phonePattern = /(0\d{1,2}-\d{3,4}-\d{4}|1\d{3}-\d{4}|\b1345\b)/

export interface RuleContact {
  /** Office name before the number ("시흥시 자원순환과"); may be empty. */
  name: string
  /** Number as shown, e.g. "031-310-2254". */
  phone: string
  /** `tel:` target without dashes. */
  tel: string
  /** Text after the number, e.g. "(평일 09:00~18:00)". */
  note: string
}

/**
 * Splits a contact fact ("A 1577-1366 / B 031-319-7997") into one entry per
 * number, for the detail screen's call buttons. Parts without a number are
 * dropped (the full text is still shown elsewhere).
 */
export function parseContacts(text: string): RuleContact[] {
  return text.split(' / ').flatMap((part) => {
    const match = phonePattern.exec(part)
    if (!match) return []
    const phone = match[0]
    return [
      {
        name: part.slice(0, match.index).trim(),
        phone,
        tel: phone.replace(/-/g, ''),
        note: part.slice(match.index + phone.length).trim(),
      },
    ]
  })
}

/** "과태료 있음" tag: the rule's penalty mentions a fine (checked in Korean). */
export function hasFine(entry: RuleEntry) {
  return entry.facts?.penalty?.ko.includes('과태료') ?? false
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

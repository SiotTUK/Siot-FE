import type { Language } from '@/shared/api/types'
import type { RuleFaqResponse, RuleResponse } from './api'

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

/** One rule as the screens use it, built from the BE `RuleResponse`. */
export interface Rule {
  code: string
  /** null: a category the screens do not know (added by an admin). */
  category: RuleCategory | null
  title: string
  summary: string
  points: string[]
  facts: { key: FactKey; value: string }[]
  sources: { name: string; url: string }[]
  /** The penalty includes a fine (shown as a "과태료·범칙금 있음" tag). */
  fine: boolean
  /** YYYY-MM-DD the text was checked against the sources. */
  checkedOn: string | null
  /** false → the text is the Korean original: "번역 준비 중". */
  translated: boolean
  taxKind: string | null
}

export interface RuleFaqItem {
  question: string
  answer: string
  /** The rule to open for details. */
  rule: string
}

const isRuleCategory = (value: string | null): value is RuleCategory =>
  ruleCategories.some((category) => category === value)

/**
 * The penalty mentions a fine, in the language it is written in. The BE
 * sends one language, so each has its own word: 과태료·범칙금 (ko), fine (en),
 * 罚款 (zh), phạt (vi). The FE seed text gives the same answer in all four.
 */
const finePatterns: Record<Language, RegExp> = {
  ko: /과태료|범칙금/,
  en: /\bfines?\b/i,
  zh: /罚款/,
  vi: /phạt/i,
}

export function mentionsFine(penalty: string | null, language: Language) {
  return penalty ? finePatterns[language].test(penalty) : false
}

/**
 * BE fields → the screens' facts. `penalty` is checked in the language the
 * text is in: Korean when the rule is not translated yet.
 */
export function toRule(response: RuleResponse, language: Language): Rule {
  const values: Record<FactKey, string | null> = {
    when: response.when,
    where: response.place,
    fee: response.fee,
    penalty: response.penalty,
    law: response.law,
    contact: response.contact,
  }
  return {
    code: response.code,
    category: isRuleCategory(response.categoryKey)
      ? response.categoryKey
      : null,
    title: response.title,
    summary: response.summary ?? '',
    points: response.points,
    facts: factKeys.flatMap((key) => {
      const value = values[key]?.trim()
      return value ? [{ key, value }] : []
    }),
    sources: response.sources,
    fine: mentionsFine(response.penalty, response.translated ? language : 'ko'),
    checkedOn: response.checkedOn,
    translated: response.translated,
    taxKind: response.taxKind,
  }
}

/** FAQ rows that open a rule; a row whose rule was deleted is left out. */
export function toFaqItems(faqs: RuleFaqResponse[]): RuleFaqItem[] {
  return faqs.flatMap((faq) =>
    faq.ruleCode
      ? [{ question: faq.question, answer: faq.answer, rule: faq.ruleCode }]
      : [],
  )
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

/**
 * A rule slug such as `waste-food`. The list of rules now lives in the BE,
 * so links only check the shape; the detail screen shows "not found" for a
 * code the BE does not know.
 */
export function isRuleCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

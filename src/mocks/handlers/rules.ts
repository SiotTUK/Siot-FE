import { http, HttpResponse } from 'msw'
import type { RuleFaqResponse, RuleResponse } from '@/features/rules/api'
import type { Language } from '@/shared/api/types'
import { isLanguage } from '@/shared/i18n'
import {
  ruleEntries,
  ruleFaqs,
  rulesCheckedOn,
  type RuleEntry,
} from '../data/rule-content'
import { error } from '../db'

/**
 * The tax kinds the BE seed gives the tax rules (BE #29, RuleResponse.taxKind).
 * Mock-only copy: the app reads `taxKind` from the response.
 */
const taxKinds: Record<string, string> = {
  'tax-car': 'TAX_CAR',
  'tax-property': 'TAX_PROPERTY',
  'tax-resident': 'TAX_RESIDENT',
}

/** BE `?language=`: ko/en/zh/vi, missing = ko, anything else 400. */
function requestLanguage(request: Request): Language | null {
  const value = new URL(request.url).searchParams.get('language')
  if (value === null || value === '') return 'ko'
  return isLanguage(value) ? value : null
}

const badLanguage = () =>
  error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')

/** The fields of the BE `RuleResponse` the FE reads, as the BE seed holds them. */
export function mockRule(entry: RuleEntry, language: Language): RuleResponse {
  const fact = (key: keyof NonNullable<RuleEntry['facts']>) =>
    entry.facts?.[key]?.[language] ?? null
  return {
    code: entry.code,
    categoryKey: entry.category,
    title: entry.title[language],
    summary: entry.summary[language],
    points: entry.points.map((point) => point[language]),
    when: fact('when'),
    place: fact('where'),
    fee: fact('fee'),
    penalty: fact('penalty'),
    law: fact('law'),
    contact: fact('contact'),
    sources: entry.sources,
    checkedOn: rulesCheckedOn,
    translated: true,
    taxKind: taxKinds[entry.code] ?? null,
  }
}

export function mockRuleFaqs(language: Language): RuleFaqResponse[] {
  return ruleFaqs.map((faq, index) => ({
    sortOrder: index + 1,
    question: faq.question[language],
    answer: faq.answer[language],
    ruleCode: faq.rule,
    ruleTitle:
      ruleEntries.find((entry) => entry.code === faq.rule)?.title[language] ??
      null,
    language,
  }))
}

export const ruleHandlers = [
  // The seed is already in category order, then the order inside each category.
  http.get('*/api/rules', ({ request }) => {
    const language = requestLanguage(request)
    if (!language) return badLanguage()
    const category = new URL(request.url).searchParams.get('category')
    const entries = category
      ? ruleEntries.filter((entry) => entry.category === category)
      : ruleEntries
    return HttpResponse.json({
      data: entries.map((entry) => mockRule(entry, language)),
    })
  }),
  // Registered before `:code` so "faq" is not read as a rule code.
  http.get('*/api/rules/faq', ({ request }) => {
    const language = requestLanguage(request)
    if (!language) return badLanguage()
    return HttpResponse.json({ data: mockRuleFaqs(language) })
  }),
  http.get('*/api/rules/:code', ({ params, request }) => {
    const language = requestLanguage(request)
    if (!language) return badLanguage()
    const entry = ruleEntries.find((item) => item.code === String(params.code))
    if (!entry) return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    return HttpResponse.json({ data: mockRule(entry, language) })
  }),
]

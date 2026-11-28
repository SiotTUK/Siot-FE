import { http, HttpResponse } from 'msw'
import type {
  AdminRuleCategory,
  AdminRuleFaq,
  AdminRuleSummary,
  RuleFaqText,
} from '@/features/admin/rule-api'
import { ruleMessages } from '@/features/rules/messages'
import { ruleEntries, ruleFaqs, rulesCheckedOn } from '../data/rule-content'
import { body, error, persist, state, type MockAdminRules } from '../db'
import { requireAdmin } from './admin'

/**
 * ADM-06·RUL-04·09~13 admin rule APIs over a mutable copy of the rule mock.
 * Dev/test only. The members' rule handlers keep serving the fixed copy, so
 * changes here do not show on the member screens in the mock.
 */
const languages = ['en', 'zh', 'vi'] as const
const urlPattern = /^\s*https?:\/\/\S+\s*$/

function seed(): MockAdminRules {
  const category = (key: keyof typeof ruleMessages.ko.rules.groups) =>
    ruleMessages.ko.rules.groups[key]
  const rules: MockAdminRules['rules'] = {}
  ruleEntries.forEach((entry, index) => {
    const fact = (key: string) =>
      entry.facts?.[key as keyof typeof entry.facts]?.ko ?? null
    rules[entry.code] = {
      code: entry.code,
      category: category(entry.category),
      title: entry.title.ko,
      summary: entry.summary.ko,
      content: entry.points.map((point) => point.ko).join('\n'),
      badge: null,
      place: fact('where'),
      docs: [],
      fee: fact('fee'),
      law: fact('law'),
      penalty: fact('penalty'),
      contact: fact('contact'),
      sourceUrl: entry.sources[0]?.url ?? null,
      sourceName: null,
      sortOrder: index + 1,
      faq: false,
      noticeChangedAt: null,
      points: entry.points.map((point) => point.ko),
      when: fact('when'),
      sources: entry.sources,
      checkedOn: rulesCheckedOn,
      deletedAt: null,
      updatedAt: null,
    }
  })
  const categoryNames: MockAdminRules['categoryNames'] = {}
  for (const key of Object.keys(ruleMessages.ko.rules.groups) as Array<
    keyof typeof ruleMessages.ko.rules.groups
  >)
    categoryNames[category(key)] = Object.fromEntries(
      languages.map((language) => [
        language,
        ruleMessages[language].rules.groups[key],
      ]),
    )
  const faqs = ruleFaqs.map((faq, index) => ({
    faqId: index + 1,
    sortOrder: index + 1,
    ruleCode: faq.rule,
    translations: Object.fromEntries(
      (['ko', ...languages] as const).map((language) => [
        language,
        { question: faq.question[language], answer: faq.answer[language] },
      ]),
    ),
  }))
  return { rules, categoryNames, faqs, nextFaqId: faqs.length + 1 }
}

function data() {
  state.adminRules ??= seed()
  return state.adminRules
}

const notFound = () => error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
const invalid = (message = '요청 값이 올바르지 않습니다.') =>
  error(400, 'INVALID_INPUT', message)
const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

function summary(rule: MockAdminRules['rules'][string]): AdminRuleSummary {
  return {
    code: rule.code,
    category: rule.category,
    title: rule.title,
    sortOrder: rule.sortOrder,
    faq: rule.faq,
    deleted: rule.deletedAt !== null,
    deletedAt: rule.deletedAt,
    updatedAt: rule.updatedAt,
    noticeChangedAt: rule.noticeChangedAt,
    translatedLanguages: [...languages],
    missingLanguages: [],
  }
}

function detail(rule: MockAdminRules['rules'][string]) {
  // The BE RuleResponse has no deletedAt/updatedAt.
  const { deletedAt: _deleted, updatedAt: _updated, ...rest } = rule
  void _deleted
  void _updated
  return rest
}

/** Same checks as RuleCreateRequest/RuleUpdateRequest (subset). */
function checkRule(input: Record<string, unknown>) {
  const points = Array.isArray(input.points) ? input.points.map(String) : []
  const sources = Array.isArray(input.sources) ? input.sources : []
  if (!text(input.title) || String(input.title).length > 255) return false
  if (!text(input.content) && points.length === 0) return false
  if (points.length > 30 || sources.length > 10) return false
  return sources.every(
    (source: { name?: unknown; url?: unknown }) =>
      text(source?.name) &&
      typeof source.url === 'string' &&
      urlPattern.test(source.url),
  )
}

function applyRule(
  rule: MockAdminRules['rules'][string],
  input: Record<string, unknown>,
) {
  const points = Array.isArray(input.points)
    ? input.points.map((point) => String(point).trim())
    : []
  const sources = Array.isArray(input.sources)
    ? (input.sources as { name: string; url: string }[]).map((source) => ({
        name: source.name.trim(),
        url: source.url.trim(),
      }))
    : rule.sources
  Object.assign(rule, {
    title: String(input.title).trim(),
    summary: text(input.summary),
    content: text(input.content) ?? points.join('\n'),
    badge: text(input.badge),
    place: text(input.place),
    docs: Array.isArray(input.docs) ? input.docs.map(String) : [],
    fee: text(input.fee),
    law: text(input.law),
    penalty: text(input.penalty),
    sourceName: text(input.sourceName),
    points,
    when: text(input.when),
    sources,
    sourceUrl: sources[0]?.url ?? rule.sourceUrl,
    updatedAt: new Date().toISOString(),
  })
  if (typeof input.contact === 'string') rule.contact = text(input.contact)
  if (typeof input.checkedOn === 'string') rule.checkedOn = input.checkedOn
  if (typeof input.category === 'string' && input.category.trim())
    rule.category = input.category.trim()
  if (typeof input.sortOrder === 'number') rule.sortOrder = input.sortOrder
  if (typeof input.faq === 'boolean') rule.faq = input.faq
}

function categoryList(): AdminRuleCategory[] {
  const { rules, categoryNames } = data()
  const counts = new Map<string, number>()
  for (const rule of Object.values(rules))
    if (!rule.deletedAt)
      counts.set(rule.category, (counts.get(rule.category) ?? 0) + 1)
  return [...counts].map(([category, ruleCount]) => ({
    category,
    ruleCount,
    translations: categoryNames[category] ?? {},
  }))
}

function faqView(faq: MockAdminRules['faqs'][number]): AdminRuleFaq {
  const rule = faq.ruleCode ? data().rules[faq.ruleCode] : undefined
  return {
    ...faq,
    ruleTitle: rule?.title ?? null,
    ruleDeleted: Boolean(rule?.deletedAt),
  }
}

/** ko required; only ko/en/zh/vi; each question and answer filled. */
function checkFaq(input: Record<string, unknown>) {
  const translations = input.translations as
    Record<string, Partial<RuleFaqText>> | undefined
  if (typeof input.sortOrder !== 'number' || !translations?.ko) return null
  const allowed = ['ko', ...languages] as string[]
  const entries = Object.entries(translations)
  if (
    !entries.every(
      ([language, value]) =>
        allowed.includes(language) &&
        text(value?.question) &&
        text(value?.answer) &&
        String(value.question).length <= 500 &&
        String(value.answer).length <= 5000,
    )
  )
    return null
  return Object.fromEntries(
    entries.map(([language, value]) => [
      language,
      { question: text(value.question), answer: text(value.answer) },
    ]),
  ) as AdminRuleFaq['translations']
}

function linkedRule(ruleCode: unknown) {
  const code = typeof ruleCode === 'string' ? ruleCode.trim() : ''
  if (!code) return { code: null }
  const rule = data().rules[code]
  return rule && !rule.deletedAt ? { code } : undefined
}

export const adminRuleHandlers = [
  http.get('*/api/admin/rules', ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const url = new URL(request.url)
    const category = url.searchParams.get('category') ?? ''
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase()
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
    const rows = Object.values(data().rules)
      .filter((rule) => includeDeleted || !rule.deletedAt)
      .filter((rule) => !category || rule.category === category)
      .filter(
        (rule) =>
          !keyword ||
          rule.code.toLowerCase().includes(keyword) ||
          rule.title.toLowerCase().includes(keyword),
      )
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          a.sortOrder - b.sortOrder ||
          a.code.localeCompare(b.code),
      )
      .map(summary)
    return HttpResponse.json({ data: rows })
  }),

  http.get('*/api/admin/rules/:code', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const rule = data().rules[String(params.code)]
    return rule ? HttpResponse.json({ data: detail(rule) }) : notFound()
  }),

  http.post('*/api/admin/rules', async ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const input = await body(request)
    const code = text(input.code)
    const category = text(input.category)
    if (!code || !category || !checkRule(input)) return invalid()
    const { rules, categoryNames } = data()
    // Codes of deleted rules (and other items) cannot be reused.
    if (rules[code] || /^(CL|LC)-/.test(code))
      return error(
        409,
        'DUPLICATE_GUIDE_CODE',
        '이미 쓰고 있거나 삭제한 항목이 쓰던 코드입니다. 다른 코드를 입력해 주세요.',
      )
    const rule = {
      ...detail(Object.values(rules)[0]),
      code,
      category,
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
      faq: input.faq === true,
      contact: null,
      sourceUrl: null,
      checkedOn: null,
      noticeChangedAt: null,
      deletedAt: null,
      updatedAt: null,
    }
    applyRule(rule, input)
    rules[code] = rule
    // RUL-13: the BE auto-translates a new category name.
    categoryNames[category] ??= Object.fromEntries(
      languages.map((language) => [
        language,
        `${language.toUpperCase()} ${category}`,
      ]),
    )
    persist()
    return HttpResponse.json({ data: detail(rule) }, { status: 201 })
  }),

  http.put('*/api/admin/rules/:code', async ({ request, params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const rule = data().rules[String(params.code)]
    if (!rule || rule.deletedAt) return notFound()
    const input = await body(request)
    if (
      typeof input.noticeChanged !== 'boolean' ||
      (typeof input.category === 'string' && !input.category.trim()) ||
      !checkRule(input)
    )
      return invalid()
    applyRule(rule, input)
    if (input.noticeChanged) rule.noticeChangedAt = rule.updatedAt
    persist()
    return HttpResponse.json({ data: detail(rule) })
  }),

  http.delete('*/api/admin/rules/:code', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const rule = data().rules[String(params.code)]
    if (!rule || rule.deletedAt) return notFound()
    rule.deletedAt = new Date().toISOString()
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/admin/rule-categories', () => {
    const denied = requireAdmin()
    if (denied) return denied
    return HttpResponse.json({ data: categoryList() })
  }),

  http.put(
    '*/api/admin/rule-categories/:category',
    async ({ request, params }) => {
      const denied = requireAdmin()
      if (denied) return denied
      const from = String(params.category)
      const name = text((await body(request)).name)
      if (!name || name.length > 100) return invalid()
      const { rules, categoryNames } = data()
      const moving = Object.values(rules).filter(
        (rule) => !rule.deletedAt && rule.category === from,
      )
      if (moving.length === 0)
        return error(
          404,
          'RULE_CATEGORY_NOT_FOUND',
          '생활수칙 카테고리를 찾을 수 없습니다.',
        )
      for (const rule of moving) rule.category = name
      // The BE re-translates the new name; an existing name keeps its names.
      categoryNames[name] ??= Object.fromEntries(
        languages.map((language) => [
          language,
          `${language.toUpperCase()} ${name}`,
        ]),
      )
      persist()
      return HttpResponse.json({
        data: categoryList().find((item) => item.category === name),
      })
    },
  ),

  http.put(
    '*/api/admin/rule-categories/:category/translations/:language',
    async ({ request, params }) => {
      const denied = requireAdmin()
      if (denied) return denied
      const category = String(params.category)
      const language = String(params.language) as (typeof languages)[number]
      const name = text((await body(request)).name)
      if (!languages.includes(language) || !name || name.length > 100)
        return invalid()
      const found = categoryList().find((item) => item.category === category)
      if (!found)
        return error(
          404,
          'RULE_CATEGORY_NOT_FOUND',
          '생활수칙 카테고리를 찾을 수 없습니다.',
        )
      const { categoryNames } = data()
      categoryNames[category] = { ...categoryNames[category], [language]: name }
      persist()
      return HttpResponse.json({
        data: categoryList().find((item) => item.category === category),
      })
    },
  ),

  http.get('*/api/admin/rule-faqs', () => {
    const denied = requireAdmin()
    if (denied) return denied
    const faqs = [...data().faqs].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.faqId - b.faqId,
    )
    return HttpResponse.json({ data: faqs.map(faqView) })
  }),

  http.post('*/api/admin/rule-faqs', async ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const input = await body(request)
    const translations = checkFaq(input)
    if (!translations) return invalid()
    const rule = linkedRule(input.ruleCode)
    if (!rule) return notFound()
    const store = data()
    const faq = {
      faqId: store.nextFaqId++,
      sortOrder: input.sortOrder as number,
      ruleCode: rule.code,
      translations,
    }
    store.faqs.push(faq)
    persist()
    return HttpResponse.json({ data: faqView(faq) }, { status: 201 })
  }),

  http.put('*/api/admin/rule-faqs/:faqId', async ({ request, params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const faq = data().faqs.find((item) => item.faqId === Number(params.faqId))
    if (!faq)
      return error(
        404,
        'RULE_FAQ_NOT_FOUND',
        '자주 묻는 질문을 찾을 수 없습니다.',
      )
    const input = await body(request)
    const translations = checkFaq(input)
    if (!translations) return invalid()
    const rule = linkedRule(input.ruleCode)
    if (!rule) return notFound()
    Object.assign(faq, {
      sortOrder: input.sortOrder,
      ruleCode: rule.code,
      translations,
    })
    persist()
    return HttpResponse.json({ data: faqView(faq) })
  }),

  http.delete('*/api/admin/rule-faqs/:faqId', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const store = data()
    const index = store.faqs.findIndex(
      (item) => item.faqId === Number(params.faqId),
    )
    if (index < 0)
      return error(
        404,
        'RULE_FAQ_NOT_FOUND',
        '자주 묻는 질문을 찾을 수 없습니다.',
      )
    store.faqs.splice(index, 1)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]

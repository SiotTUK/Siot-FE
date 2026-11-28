import { http, HttpResponse } from 'msw'
import type {
  RuleCategoryResponse,
  RuleFaqResponse,
  RuleResponse,
} from '@/features/rules/api'
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

/**
 * NTF-07 rules saved as a real change (RuleResponse.noticeChangedAt), so the
 * mock shows "안내 변경" on their detail. Mock-only; the other rules have null.
 */
const noticeChanges: Record<string, string> = {
  'waste-food': '2026-11-27T14:30:00+09:00',
}

/**
 * RUL-12·13 member categories (`GET /api/rules/categories?language=`).
 * Includes the 6 built-in categories plus 1 admin-added category (`key: null`)
 * whose zh/vi translations are missing (`translated: false`) to exercise the
 * fallback & "번역 준비 중" tag in mock mode (#132).
 */
const mockCategoryDefs: {
  key: string | null
  category: string
  sortOrder: number
  names: Partial<Record<Language, string>>
}[] = [
  {
    key: 'order',
    category: '기초 질서',
    sortOrder: 10,
    names: {
      ko: '기초 질서',
      en: 'Public order',
      zh: '基本秩序',
      vi: 'Trật tự công cộng',
    },
  },
  {
    key: 'waste',
    category: '쓰레기',
    sortOrder: 20,
    names: {
      ko: '쓰레기',
      en: 'Waste',
      zh: '垃圾分类',
      vi: 'Phân loại rác',
    },
  },
  {
    key: 'traffic',
    category: '교통',
    sortOrder: 30,
    names: {
      ko: '교통',
      en: 'Traffic',
      zh: '交通',
      vi: 'Giao thông',
    },
  },
  {
    key: 'tax',
    category: '세금',
    sortOrder: 40,
    names: {
      ko: '세금',
      en: 'Taxes',
      zh: '税务',
      vi: 'Thuế',
    },
  },
  {
    key: 'living',
    category: '생활 편의',
    sortOrder: 50,
    names: {
      ko: '생활 편의',
      en: 'Daily life',
      zh: '生活便利',
      vi: 'Tiện ích đời sống',
    },
  },
  {
    key: 'support',
    category: '교육·상담',
    sortOrder: 60,
    names: {
      ko: '교육·상담',
      en: 'Support',
      zh: '教育与咨询',
      vi: 'Giáo dục & tư vấn',
    },
  },
  {
    key: null,
    category: '반려동물',
    sortOrder: 70,
    names: {
      ko: '반려동물',
      en: 'Pets',
    },
  },
]

export function mockRuleCategories(language: Language): RuleCategoryResponse[] {
  return mockCategoryDefs.map((def) => {
    const translatedName = def.names[language]
    return {
      category: def.category,
      name: translatedName ?? def.category,
      translated: Boolean(translatedName),
      key: def.key,
      sortOrder: def.sortOrder,
    }
  })
}

/** One rule belonging to the admin-added "반려동물" category (`categoryKey: null`). */
function mockAdminAddedRule(language: Language): RuleResponse {
  const category = mockRuleCategories(language).find(
    (item) => item.category === '반려동물',
  )!
  const isEn = language === 'en'
  const isKo = language === 'ko'
  return {
    code: 'pet-registration',
    category: category.category,
    categoryName: category.name,
    categoryKey: null,
    title: isEn ? 'Registering a companion dog' : '반려견 동물등록',
    summary: isEn
      ? 'Dogs aged 2 months or older must be registered at a veterinary clinic or district office.'
      : '월령 2개월 이상인 반려견은 동물병원이나 시·구청에 등록해야 해요.',
    points: isEn
      ? [
          'Visit a designated veterinary clinic with your dog to register with a microchip or tag.',
          'Report address or owner changes within 30 days on the National Animal Protection System.',
        ]
      : [
          '가까운 동물등록 대행 동물병원에 반려견과 방문해 내장형 또는 외장형으로 등록해요.',
          '주소나 소유자가 바뀌면 30일 안에 국가동물보호정보시스템에서 변경 신고해요.',
        ],
    when: isEn
      ? 'Within 30 days of reaching 2 months of age'
      : '월령 2개월이 된 날부터 30일 이내',
    place: isEn
      ? 'Designated veterinary clinics in Siheung'
      : '시흥시 동물등록 대행 동물병원',
    fee: isEn
      ? 'Registration fee 3,000–10,000 KRW (device extra)'
      : '수수료 3,000~10,000원 (무선식별장치 별도)',
    penalty: isEn
      ? 'Up to 600,000 KRW fine for unregistered dogs'
      : '미등록 시 최대 60만 원 이하 과태료',
    law: '동물보호법 제15조',
    contact: '시흥시 축수산과 031-310-2246',
    sources: [
      {
        name: '국가동물보호정보시스템',
        url: 'https://www.animal.go.kr',
      },
    ],
    checkedOn: rulesCheckedOn,
    translated: isKo || isEn,
    noticeChangedAt: null,
    taxKind: null,
  }
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
  const category = mockRuleCategories(language).find(
    (item) => item.key === entry.category,
  )
  return {
    code: entry.code,
    category: category?.category ?? entry.category,
    categoryName: category?.name ?? null,
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
    noticeChangedAt: noticeChanges[entry.code] ?? null,
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
    const all = [
      ...ruleEntries.map((entry) => mockRule(entry, language)),
      mockAdminAddedRule(language),
    ]
    const filtered = category
      ? all.filter(
          (rule) => rule.categoryKey === category || rule.category === category,
        )
      : all
    return HttpResponse.json({ data: filtered })
  }),
  // Registered before `:code` so "categories" and "faq" are not read as codes.
  http.get('*/api/rules/categories', ({ request }) => {
    const language = requestLanguage(request)
    if (!language) return badLanguage()
    return HttpResponse.json({ data: mockRuleCategories(language) })
  }),
  http.get('*/api/rules/faq', ({ request }) => {
    const language = requestLanguage(request)
    if (!language) return badLanguage()
    return HttpResponse.json({ data: mockRuleFaqs(language) })
  }),
  http.get('*/api/rules/:code', ({ params, request }) => {
    const language = requestLanguage(request)
    if (!language) return badLanguage()
    const code = String(params.code)
    if (code === 'pet-registration') {
      return HttpResponse.json({ data: mockAdminAddedRule(language) })
    }
    const entry = ruleEntries.find((item) => item.code === code)
    if (!entry) return error(404, 'GUIDE_NOT_FOUND', '항목을 찾을 수 없습니다.')
    return HttpResponse.json({ data: mockRule(entry, language) })
  }),
]

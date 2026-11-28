import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRuleCategories,
  type RuleCategoryResponse,
  type RuleFaqResponse,
  type RuleResponse,
} from './api'
import {
  categoryPath,
  categorySlug,
  findRuleCategory,
  groupByCategory,
  isRuleCode,
  koreaDateOf,
  mentionsFine,
  parseContacts,
  ruleBelongsToCategory,
  safeUrl,
  searchRules,
  toFaqItems,
  toRule,
} from './rules'

const response = (over: Partial<RuleResponse> = {}): RuleResponse => ({
  code: 'waste-food',
  categoryKey: 'waste',
  title: '음식물 쓰레기',
  summary: '요약',
  points: ['전용 용기에 버려요'],
  when: null,
  place: null,
  fee: null,
  penalty: null,
  law: null,
  contact: null,
  sources: [{ name: '시흥시', url: 'https://www.siheung.go.kr' }],
  checkedOn: '2026-11-25',
  translated: true,
  noticeChangedAt: null,
  taxKind: null,
  ...over,
})

describe('BE rule → screen rule', () => {
  it('maps the BE fields to the facts in screen order and drops empty ones', () => {
    const rule = toRule(
      response({
        contact: '시흥시 031-310-2254',
        when: '매일',
        place: '  ',
        fee: '무료',
        law: '폐기물관리법',
      }),
      'ko',
    )
    expect(rule.facts).toEqual([
      { key: 'when', value: '매일' },
      { key: 'fee', value: '무료' },
      { key: 'law', value: '폐기물관리법' },
      { key: 'contact', value: '시흥시 031-310-2254' },
    ])
    expect(rule).toMatchObject({
      code: 'waste-food',
      category: 'waste',
      checkedOn: '2026-11-25',
      translated: true,
      taxKind: null,
    })
  })

  it('keeps the place as "where" and the tax kind for the tax detail link', () => {
    const rule = toRule(
      response({ place: '주민센터', taxKind: 'TAX_CAR' }),
      'en',
    )
    expect(rule.facts).toEqual([{ key: 'where', value: '주민센터' }])
    expect(rule.taxKind).toBe('TAX_CAR')
  })

  it('keeps the day in Korea of the last real change (NTF-07)', () => {
    expect(toRule(response(), 'ko').noticeChangedOn).toBeNull()
    expect(
      toRule(response({ noticeChangedAt: '2026-11-28T10:00:00+09:00' }), 'ko')
        .noticeChangedOn,
    ).toBe('2026-11-28')
  })

  it('reads the change day in Korea whatever offset the BE writes', () => {
    // 2026-11-27 23:30 UTC is already 11-28 in Korea; 08:30 KST is still 11-27 in UTC.
    expect(koreaDateOf('2026-11-27T23:30:00Z')).toBe('2026-11-28')
    expect(koreaDateOf('2026-11-28T08:30:00+09:00')).toBe('2026-11-28')
    expect(koreaDateOf('not a date')).toBeNull()
    expect(koreaDateOf(null)).toBeNull()
  })

  it('leaves a category the screens do not know as null', () => {
    expect(toRule(response({ categoryKey: null }), 'ko').category).toBeNull()
    expect(toRule(response({ categoryKey: 'pets' }), 'ko').category).toBeNull()
  })

  it.each([
    ['ko', '과태료 최대 10만 원', true],
    ['ko', '범칙금 3만~5만원', true],
    ['ko', '봉투 수거 안 됨', false],
    ['en', 'Fine of up to 100,000 won', true],
    ['en', 'A fine applies', true],
    ['en', 'Refined sorting rules', false],
    ['zh', '最高罚款10万韩元', true],
    ['vi', 'Phạt tối đa 100.000 won', true],
  ] as const)(
    'tags a fine from the %s penalty "%s"',
    (language, text, fine) => {
      expect(mentionsFine(text, language)).toBe(fine)
    },
  )

  it('reads an untranslated penalty as Korean', () => {
    const rule = toRule(
      response({ penalty: '과태료 10만 원', translated: false }),
      'en',
    )
    expect(rule.fine).toBe(true)
    expect(rule.translated).toBe(false)
    expect(toRule(response(), 'ko').fine).toBe(false)
  })

  it('keeps FAQ rows that open a rule, in order', () => {
    const faq = (over: Partial<RuleFaqResponse>): RuleFaqResponse => ({
      sortOrder: 1,
      question: 'Q',
      answer: 'A',
      ruleCode: 'waste-food',
      ruleTitle: '음식물 쓰레기',
      language: 'ko',
      ...over,
    })
    expect(
      toFaqItems([
        faq({ question: 'Q1' }),
        faq({ question: 'Q2', ruleCode: null }),
        faq({ question: 'Q3', ruleCode: 'tax-car' }),
      ]),
    ).toEqual([
      { question: 'Q1', answer: 'A', rule: 'waste-food' },
      { question: 'Q3', answer: 'A', rule: 'tax-car' },
    ])
  })
})

describe('rule screen rules', () => {
  it('groups in the Figma category order and skips empty or unknown ones', () => {
    const rules = [
      response({ code: 'a', categoryKey: 'tax' }),
      response({ code: 'b', categoryKey: 'order' }),
      response({ code: 'c', categoryKey: 'tax' }),
      response({ code: 'd', categoryKey: null }),
    ].map((item) => toRule(item, 'ko'))
    expect(
      groupByCategory(rules).map((group) => [
        group.category,
        group.rules.map((rule) => rule.code),
      ]),
    ).toEqual([
      ['order', ['b']],
      ['tax', ['a', 'c']],
    ])
  })

  it('searches every word in title, summary and body', () => {
    const rules = [
      response({ code: 'a', title: '음식물 쓰레기' }),
      response({ code: 'b', title: '자동차세', points: ['6월'] }),
    ].map((item) => toRule(item, 'ko'))
    expect(searchRules(rules, '쓰레기').map((rule) => rule.code)).toEqual(['a'])
    expect(searchRules(rules, '자동차세 6월').map((r) => r.code)).toEqual(['b'])
    expect(searchRules(rules, '  ')).toHaveLength(2)
    expect(searchRules(rules, '없는말')).toHaveLength(0)
  })

  it.each([
    ['https://www.siheung.go.kr/a', 'https://www.siheung.go.kr/a'],
    ['javascript:alert(1)', null],
    ['/relative', null],
    [null, null],
  ])('links only http(s) sources: %s', (value, expected) => {
    expect(safeUrl(value)).toBe(expected)
  })

  it.each([
    ['waste-food', true],
    ['order-etiquette', true],
    ['living-youth-transport', true],
    ['Waste-Food', false],
    ['../admin', false],
    ['waste--food', false],
    ['', false],
    [42, false],
  ])('accepts rule slugs for links: %s', (value, expected) => {
    expect(isRuleCode(value)).toBe(expected)
  })
})

describe('rule contacts', () => {
  it('splits a contact into name, number and note', () => {
    expect(
      parseContacts('층간소음 이웃사이센터 1661-2642 (평일 09:00~18:00)'),
    ).toEqual([
      {
        name: '층간소음 이웃사이센터',
        phone: '1661-2642',
        tel: '16612642',
        note: '(평일 09:00~18:00)',
      },
    ])
    expect(
      parseContacts('다누리콜센터 1577-1366 / 시흥시 가족센터 031-319-7997'),
    ).toMatchObject([
      { name: '다누리콜센터', tel: '15771366' },
      { name: '시흥시 가족센터', tel: '0313197997' },
    ])
    expect(parseContacts('1345')).toMatchObject([
      { name: '', phone: '1345', tel: '1345' },
    ])
    expect(parseContacts('시흥시청 누리집')).toEqual([])
  })
})

describe('dynamic rule categories (RUL-12·13, #132)', () => {
  const categories: RuleCategoryResponse[] = [
    {
      category: '반려동물',
      name: 'Pets',
      translated: true,
      key: null,
      sortOrder: 70,
    },
    {
      category: '쓰레기',
      name: 'Waste',
      translated: true,
      key: 'waste',
      sortOrder: 20,
    },
  ]

  it('builds slugs/paths, resolves params, and groups rules in server sortOrder including admin-added categories', () => {
    const builtIn = categories[1]
    const custom = categories[0]
    expect(categorySlug(builtIn)).toBe('waste')
    expect(categorySlug(custom)).toBe('반려동물')
    expect(categoryPath(builtIn)).toBe('/rules/category/waste')
    expect(categoryPath(custom)).toBe(
      `/rules/category/${encodeURIComponent('반려동물')}`,
    )

    expect(findRuleCategory(categories, 'waste')).toBe(builtIn)
    expect(findRuleCategory(categories, '쓰레기')).toBe(builtIn)
    expect(findRuleCategory(categories, '반려동물')).toBe(custom)
    expect(findRuleCategory(categories, 'unknown')).toBeUndefined()

    const wasteRule = toRule(
      response({
        code: 'waste-food',
        category: '쓰레기',
        categoryName: 'Waste',
        categoryKey: 'waste',
      }),
      'en',
    )
    const petRule = toRule(
      response({
        code: 'pet-registration',
        category: '반려동물',
        categoryName: 'Pets',
        categoryKey: null,
      }),
      'en',
    )

    expect(petRule.category).toBeNull()
    expect(petRule.categoryRaw).toBe('반려동물')
    expect(petRule.categoryName).toBe('Pets')
    expect(ruleBelongsToCategory(petRule, custom)).toBe(true)
    expect(ruleBelongsToCategory(petRule, builtIn)).toBe(false)

    expect(
      groupByCategory([petRule, wasteRule], categories).map((group) => [
        group.category,
        group.rules.map((r) => r.code),
      ]),
    ).toEqual([
      ['waste', ['waste-food']],
      ['반려동물', ['pet-registration']],
    ])
  })

  describe('GET /api/rules/categories (MSW contract)', () => {
    const origin = 'http://localhost'

    beforeEach(() => {
      const interceptedFetch = globalThis.fetch
      vi.stubGlobal(
        'fetch',
        vi.fn((input: string | URL | Request, init?: RequestInit) =>
          interceptedFetch(
            typeof input === 'string' ? new URL(input, origin) : input,
            init,
          ),
        ),
      )
    })
    afterEach(() => vi.unstubAllGlobals())

    it('returns server categories including an admin-added category and translation status', async () => {
      const en = await fetchRuleCategories('en')
      const petEn = en.find((item) => item.category === '반려동물')
      expect(petEn).toMatchObject({
        category: '반려동물',
        name: 'Pets',
        translated: true,
        key: null,
      })

      const viList = await fetchRuleCategories('vi')
      const petVi = viList.find((item) => item.category === '반려동물')
      expect(petVi).toMatchObject({
        category: '반려동물',
        name: '반려동물',
        translated: false,
        key: null,
      })
    })
  })
})

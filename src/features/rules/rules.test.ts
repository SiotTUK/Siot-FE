import { describe, expect, it } from 'vitest'
import { languages } from '@/shared/i18n'
import { ruleEntries, ruleFaqs, rulesCheckedOn } from './content'
import {
  groupByCategory,
  localizeRule,
  parseContacts,
  safeUrl,
  searchRules,
  type Localized,
  type RuleEntry,
} from './rules'

const text = (ko: string): Localized => ({ ko, en: ko, zh: ko, vi: ko })
const entry = (over: Partial<RuleEntry>): RuleEntry => ({
  code: 'waste-bags',
  category: 'waste',
  title: text('종량제 봉투'),
  summary: text('요약'),
  points: [text('봉투에 담아 내놓아요')],
  sources: [{ name: '시흥시', url: 'https://www.siheung.go.kr' }],
  ...over,
})

describe('rule screen rules', () => {
  it('groups in the Figma category order and skips empty ones', () => {
    const rules = [
      entry({ code: 'a', category: 'tax' }),
      entry({ code: 'b', category: 'order' }),
      entry({ code: 'c', category: 'tax' }),
    ].map((item) => localizeRule(item, 'ko'))
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

  it('keeps only facts that exist in the language', () => {
    const rule = localizeRule(
      entry({ facts: { fee: text('무료'), contact: text('031') } }),
      'en',
    )
    expect(rule.facts.map((fact) => fact.key)).toEqual(['fee', 'contact'])
  })

  it('searches every word in title, summary and body', () => {
    const rules = [
      entry({ code: 'a', title: text('음식물 쓰레기') }),
      entry({ code: 'b', title: text('자동차세'), points: [text('6월')] }),
    ].map((item) => localizeRule(item, 'ko'))
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
})

describe('rule content', () => {
  it('has unique codes and the check date', () => {
    const codes = ruleEntries.map((item) => item.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(rulesCheckedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('fills every language and cites https official sources', () => {
    const codes = Object.keys(languages) as (keyof typeof languages)[]
    const all = (value: Localized) =>
      codes.every((language) => value[language].trim().length > 0)
    for (const item of ruleEntries) {
      expect(all(item.title) && all(item.summary), item.code).toBe(true)
      expect(item.points.every(all), item.code).toBe(true)
      expect(Object.values(item.facts ?? {}).every(all), item.code).toBe(true)
      expect(item.sources.length, item.code).toBeGreaterThan(0)
      for (const source of item.sources)
        expect(source.url, item.code).toMatch(/^https:\/\//)
    }
  })

  it('has a FAQ for every rule, each opening an existing rule', () => {
    const codes = ruleEntries.map((item) => item.code)
    // TOP 5 first, then one more per remaining rule: every rule once.
    expect(ruleFaqs.length).toBeGreaterThan(5)
    expect(new Set(ruleFaqs.map((faq) => faq.rule))).toEqual(new Set(codes))
    expect(ruleFaqs.map((faq) => faq.rule)).toHaveLength(codes.length)
    const all = (value: Localized) =>
      Object.keys(languages).every(
        (language) => value[language as keyof Localized].trim().length > 0,
      )
    for (const faq of ruleFaqs) {
      expect(all(faq.question), faq.rule).toBe(true)
      expect(all(faq.answer), faq.rule).toBe(true)
    }
  })

  it('finds a callable number in every contact, in every language', () => {
    for (const item of ruleEntries) {
      const contact = item.facts?.contact
      if (!contact) continue
      for (const language of Object.keys(languages) as (keyof Localized)[]) {
        const found = parseContacts(contact[language])
        expect(found.length, `${item.code} ${language}`).toBeGreaterThan(0)
        for (const { tel } of found)
          expect(tel, item.code).toMatch(/^\d{4,11}$/)
      }
    }
  })
})

describe('rule contacts and tags', () => {
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

  it('tags a rule with a fine only when its penalty mentions 과태료', () => {
    expect(
      localizeRule(entry({ facts: { penalty: text('과태료 10만 원') } }), 'en')
        .fine,
    ).toBe(true)
    expect(
      localizeRule(entry({ facts: { penalty: text('봉투 수거 안 됨') } }), 'ko')
        .fine,
    ).toBe(false)
    expect(localizeRule(entry({}), 'ko').fine).toBe(false)
  })
})

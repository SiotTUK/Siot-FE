import { describe, expect, it } from 'vitest'
import { mentionsFine, parseContacts } from '@/features/rules/rules'
import type { Language } from '@/shared/api/types'
import { languages } from '@/shared/i18n'
import { mockRule, mockRuleFaqs } from '../handlers/rules'
import {
  ruleEntries,
  ruleFaqs,
  rulesCheckedOn,
  type Localized,
} from './rule-content'

const allLanguages = Object.keys(languages) as Language[]
const filled = (value: Localized) =>
  allLanguages.every((language) => value[language].trim().length > 0)

/** The mock copy of the BE seed stays complete, so `dev:mock` shows every screen. */
describe('mock rule content', () => {
  it('has unique codes and the check date', () => {
    const codes = ruleEntries.map((item) => item.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(rulesCheckedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('fills every language and cites https official sources', () => {
    for (const item of ruleEntries) {
      expect(filled(item.title) && filled(item.summary), item.code).toBe(true)
      expect(item.points.every(filled), item.code).toBe(true)
      expect(Object.values(item.facts ?? {}).every(filled), item.code).toBe(
        true,
      )
      expect(item.sources.length, item.code).toBeGreaterThan(0)
      for (const source of item.sources)
        expect(source.url, item.code).toMatch(/^https:\/\//)
    }
  })

  it('has a FAQ for every rule, each opening an existing rule', () => {
    const codes = ruleEntries.map((item) => item.code)
    expect(ruleFaqs.length).toBeGreaterThan(5)
    expect(new Set(ruleFaqs.map((faq) => faq.rule))).toEqual(new Set(codes))
    for (const faq of ruleFaqs) {
      expect(filled(faq.question), faq.rule).toBe(true)
      expect(filled(faq.answer), faq.rule).toBe(true)
    }
  })

  it('finds a callable number in every contact, in every language', () => {
    for (const item of ruleEntries) {
      const contact = item.facts?.contact
      if (!contact) continue
      for (const language of allLanguages) {
        const found = parseContacts(contact[language])
        expect(found.length, `${item.code} ${language}`).toBeGreaterThan(0)
        for (const { tel } of found)
          expect(tel, item.code).toMatch(/^\d{4,11}$/)
      }
    }
  })

  it('tags the same rules with a fine in every language', () => {
    for (const item of ruleEntries) {
      const korean = mentionsFine(item.facts?.penalty?.ko ?? null, 'ko')
      for (const language of allLanguages)
        expect(
          mentionsFine(item.facts?.penalty?.[language] ?? null, language),
          `${item.code} ${language}`,
        ).toBe(korean)
    }
  })
})

describe('mock rules API', () => {
  it('answers like the BE RuleResponse, in the requested language', () => {
    const entry = ruleEntries.find((item) => item.code === 'tax-car')!
    expect(mockRule(entry, 'en')).toMatchObject({
      code: 'tax-car',
      categoryKey: 'tax',
      title: entry.title.en,
      checkedOn: rulesCheckedOn,
      translated: true,
      taxKind: 'TAX_CAR',
    })
    const noise = ruleEntries.find((item) => item.code === 'order-noise')!
    expect(mockRule(noise, 'ko').taxKind).toBeNull()
  })

  it('numbers the FAQ and links each to its rule title', () => {
    const faqs = mockRuleFaqs('vi')
    expect(faqs.map((faq) => faq.sortOrder)).toEqual(
      faqs.map((_, index) => index + 1),
    )
    for (const faq of faqs) {
      expect(faq.language).toBe('vi')
      expect(faq.ruleTitle).toBe(
        ruleEntries.find((item) => item.code === faq.ruleCode)?.title.vi,
      )
    }
  })
})

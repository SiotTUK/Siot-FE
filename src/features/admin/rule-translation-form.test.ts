import { describe, expect, it } from 'vitest'
import type { GuideTranslationResponse } from './api'
import {
  ruleTranslationSchema,
  toRuleTranslationForm,
  toRuleTranslationRequest,
} from './rule-translation-form'

const saved: GuideTranslationResponse = {
  code: 'waste-food',
  language: 'en',
  title: 'Food waste',
  summary: 'Use the food waste bag.',
  content: 'Old body text',
  badge: 'Daily',
  place: null,
  docs: ['Bag'],
  fee: null,
  law: null,
  penalty: 'Fine',
  sourceName: 'Siheung City',
  noticeChangedAt: null,
  updatedAt: '2026-11-28T00:00:00Z',
  pageStart: null,
  pageEnd: null,
  sourcePages: null,
  points: ['Drain water first.', 'Put it out after 6 pm.'],
  when: 'Every day',
  contact: '031-310-2114',
  reviewed: false,
}

describe('rule translation form', () => {
  it('starts from the saved translation, one point per line', () => {
    expect(toRuleTranslationForm(saved)).toMatchObject({
      title: 'Food waste',
      points: 'Drain water first.\nPut it out after 6 pm.',
      when: 'Every day',
      contact: '031-310-2114',
      noticeChanged: false,
    })
    expect(toRuleTranslationForm(null).title).toBe('')
  })

  it('keeps fields it does not show and sends rule fields so blanks clear', () => {
    const form = {
      ...toRuleTranslationForm(saved),
      points: ' Drain water first. \n\n Tie the bag. ',
      when: '  ',
      contact: '',
    }
    expect(toRuleTranslationRequest(form, saved)).toEqual({
      title: 'Food waste',
      summary: 'Use the food waste bag.',
      content: 'Old body text',
      badge: 'Daily',
      place: null,
      docs: ['Bag'],
      fee: null,
      law: null,
      penalty: 'Fine',
      sourceName: 'Siheung City',
      noticeChanged: false,
      points: ['Drain water first.', 'Tie the bag.'],
      when: '',
      contact: '',
    })
  })

  it('needs a title and limits the points', () => {
    const form = toRuleTranslationForm(saved)
    expect(
      ruleTranslationSchema.safeParse({ ...form, title: ' ' }).success,
    ).toBe(false)
    expect(
      ruleTranslationSchema.safeParse({
        ...form,
        points: Array.from({ length: 31 }, (_, i) => `p${i}`).join('\n'),
      }).success,
    ).toBe(false)
  })
})

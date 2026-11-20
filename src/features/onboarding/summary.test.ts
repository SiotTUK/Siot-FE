import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import { situationSummary } from './summary'

const ko = i18n.getFixedT('ko')
const en = i18n.getFixedT('en')

describe('home situation summary', () => {
  it('matches the H1 card for a new arrival', () => {
    expect(
      situationSummary(ko, {
        userType: 'NEW',
        purpose: 'WORK',
        entryDate: '2026-08-20',
        stayExpiry: null,
        residences: [],
      }),
    ).toEqual({
      title: '한국에 처음 입국했어요 · 일하러 왔어요',
      detail: '입국일 2026-08-20 · 거주 정보 없음',
    })
  })

  it('lists expiry and residences in a stable order', () => {
    expect(
      situationSummary(ko, {
        userType: 'LIVING',
        purpose: 'STUDY',
        entryDate: null,
        stayExpiry: '2026-12-10',
        residences: ['F4', 'KOREAN'],
      }).detail,
    ).toBe('체류 만료 2026-12-10 · 한국어 공부, 재외동포(F-4)')
  })

  it('leaves out a skipped purpose and follows the language', () => {
    expect(
      situationSummary(en, {
        userType: 'LIVING',
        purpose: null,
        entryDate: null,
        stayExpiry: null,
        residences: ['KIDS'],
      }),
    ).toEqual({ title: 'I already live in Korea', detail: 'Children' })
  })
})

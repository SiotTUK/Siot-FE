import { createInstance } from 'i18next'
import { describe, expect, it } from 'vitest'
import { chatBillSummary } from './chat-bill-summary'
import { chatMessages } from './messages'

async function translator(language: keyof typeof chatMessages) {
  const instance = createInstance()
  await instance.init({
    lng: language,
    resources: { [language]: { translation: chatMessages[language] } },
    interpolation: { escapeValue: false },
  })
  return instance.t
}

// 2026-11-28 in Korea.
const now = new Date('2026-11-28T03:00:00Z')
const bill = {
  documentType: 'TAX_NOTICE',
  taxKind: 'TAX_CAR',
  amount: 12500,
  dueDate: '2026-12-31',
} as const
const nothing = {
  documentType: null,
  taxKind: null,
  amount: null,
  dueDate: null,
} as const

describe('one line summary of a bill in the chat', () => {
  it.each([
    ['ko', '자동차세 고지서예요. 12,500원을 12월 31일까지 내야 해요.'],
    [
      'en',
      'This is a vehicle tax notice. You need to pay ₩12,500 by December 31.',
    ],
    ['zh', '这是汽车税缴费通知。需要在12月31日前缴纳12,500韩元。'],
    [
      'vi',
      'Đây là thông báo thuế xe. Bạn cần nộp 12.500 won chậm nhất vào ngày 31 tháng 12.',
    ],
  ] as const)('is written in %s', async (language, sentence) => {
    const t = await translator(language)
    expect(chatBillSummary(t, bill, language, now)).toBe(sentence)
  })

  it.each([
    [
      { ...bill, documentType: null, taxKind: null },
      '12,500원을 12월 31일까지 내야 해요.',
    ],
    [
      { ...bill, amount: null },
      '자동차세 고지서예요. 12월 31일까지 내야 해요.',
    ],
    [{ ...bill, dueDate: null }, '자동차세 고지서예요. 12,500원을 내야 해요.'],
    [{ ...nothing, documentType: 'TAX_NOTICE' }, '납세고지서예요.'],
    [{ ...nothing, amount: 12500 }, '12,500원을 내야 해요.'],
    [{ ...nothing, dueDate: '2026-12-31' }, '12월 31일까지 내야 해요.'],
  ] as const)('leaves out missing values: %o', async (result, sentence) => {
    const t = await translator('ko')
    expect(chatBillSummary(t, result, 'ko', now)).toBe(sentence)
  })

  it('has no sentence when nothing is known', async () => {
    const t = await translator('ko')
    expect(chatBillSummary(t, nothing, 'ko', now)).toBeNull()
    expect(
      chatBillSummary(t, { ...nothing, documentType: 'OTHER' }, 'ko', now),
    ).toBeNull()
  })

  it.each([
    ['DEMAND_NOTICE', 'TAX_CAR', '독촉장이에요.'],
    ['ARREARS_NOTICE', 'TAX_PROPERTY', '체납액 고지서예요.'],
    ['UTILITY', null, '공과금·보험료 고지서예요.'],
    ['TAX_NOTICE', 'TAX_PROPERTY', '재산세 고지서예요.'],
    [null, 'TAX_RESIDENT', '주민세 고지서예요.'],
    ['TAX_NOTICE', 'TAX_UNKNOWN', '납세고지서예요.'],
    ['TAX_NOTICE', undefined, '납세고지서예요.'],
  ] as const)('names %s with %s', async (documentType, taxKind, sentence) => {
    const t = await translator('ko')
    expect(
      chatBillSummary(t, { ...nothing, documentType, taxKind }, 'ko', now),
    ).toBe(sentence)
  })

  it.each([
    ['ko', '자동차세 고지서예요. 납부 기한 11월 1일이 지났어요.'],
    [
      'en',
      'This is a vehicle tax notice. The payment deadline of November 1 has passed.',
    ],
    ['zh', '这是汽车税缴费通知。缴费期限11月1日已过。'],
    ['vi', 'Đây là thông báo thuế xe. Hạn nộp ngày 1 tháng 11 đã qua.'],
  ] as const)(
    'says only that the deadline has passed in %s',
    async (language, sentence) => {
      const t = await translator(language)
      expect(
        chatBillSummary(t, { ...bill, dueDate: '2026-11-01' }, language, now),
      ).toBe(sentence)
    },
  )

  it('treats a deadline as passed from the next day in Korea', async () => {
    const t = await translator('ko')
    const summary = (dueDate: string, at: Date) =>
      chatBillSummary(t, { ...nothing, dueDate }, 'ko', at)

    expect(summary('2026-11-28', now)).toBe('11월 28일까지 내야 해요.')
    expect(summary('2026-11-27', now)).toBe('납부 기한 11월 27일이 지났어요.')
    // Already 11-28 in Korea, still 11-27 in UTC.
    expect(summary('2026-11-27', new Date('2026-11-27T15:00:00Z'))).toBe(
      '납부 기한 11월 27일이 지났어요.',
    )
  })

  it('spells out the year of a passed deadline from another year', async () => {
    const t = await translator('ko')
    expect(
      chatBillSummary(t, { ...nothing, dueDate: '2025-11-01' }, 'ko', now),
    ).toBe('납부 기한 2025년 11월 1일이 지났어요.')
  })

  it('adds the year to a deadline outside this year', async () => {
    const t = await translator('ko')
    expect(
      chatBillSummary(t, { ...nothing, dueDate: '2027-01-05' }, 'ko', now),
    ).toBe('2027. 1. 5.까지 내야 해요.')
  })
})

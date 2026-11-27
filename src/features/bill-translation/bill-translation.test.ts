import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import type { RelatedBillGuide } from './api'
import {
  billBackPath,
  billAmountLine,
  billDDayLabel,
  billDueLine,
  billGuidePath,
  formatBillAmount,
  trimBillParentheses,
  visibleBillGuides,
} from './bill-translation'

describe('repeated text in a bill result', () => {
  it.each([
    '2026-07-10',
    '2026.7.10',
    '2026. 7. 10.',
    '2026/07/10',
    '2026년 7월 10일',
    '2026年7月10日',
    'Jul 10, 2026',
    'July 10, 2026.',
    '납부 기한: 2026-07-10',
    'Pay by: 2026-07-10',
    '缴纳期限：2026-07-10',
    'Hạn nộp: 2026-07-10',
  ])('hides a due line with only the same date: %s', (line) => {
    expect(billDueLine(line, '2026-07-10')).toBeUndefined()
  })

  it.each([
    '2026-07-11',
    '2026-07-10까지 내세요.',
    'Pay by 2026-07-10.',
    '2026-07-10 (금)',
    '2026-07-10, after that 2026-07-31',
    '납기 후 기한: 2026-07-10',
    '납부 기한을 읽지 못했습니다.',
  ])('keeps a due line that is not only that date: %s', (line) => {
    expect(billDueLine(line, '2026-07-10')).toBe(line)
  })

  it.each([
    '35,000원',
    '35,000 won',
    '35000 KRW',
    '₩35,000.',
    '35.000 won',
    '납부 금액: 35,000원',
    'Amount to pay: 35,000 won',
    'Số tiền phải nộp: 35.000 won',
    '35,000韩元',
    '35,000元。',
    '35.000 đồng',
    '35.000 Đồng',
    '35.000 VND',
  ])('hides an amount line with only the same amount: %s', (line) => {
    expect(billAmountLine(line, 35000)).toBeUndefined()
  })

  it.each([
    '缴纳金额：32,000韩元',
    '32.000 đồng',
    'Số tiền phải nộp: 32.000 đồng',
    // The same letters typed as separate accent marks.
    '32.000 đồng'.normalize('NFD'),
  ])('hides a Chinese or Vietnamese amount line: %s', (line) => {
    expect(billAmountLine(line, 32000)).toBeUndefined()
  })

  it.each([
    '缴纳金额：33,000韩元',
    '32,000美元',
    '逾期后缴纳32,000韩元',
    '32.000 đồng sau hạn nộp',
    '3.200 đồng',
  ])('keeps a different Chinese or Vietnamese amount line: %s', (line) => {
    expect(billAmountLine(line, 32000)).toBe(line)
  })

  it.each([
    '35,000 won after due date',
    '34,000 won',
    '35,000 won (36,050 won after the deadline)',
    '35,000원을 내세요.',
    '납기 후 금액: 35,000원',
    '35,000 USD',
    '35,000.50 won',
  ])('keeps an amount line that says more: %s', (line) => {
    expect(billAmountLine(line, 35000)).toBe(line)
  })

  it('keeps a line when there is no value above it', () => {
    expect(billDueLine('2026-07-10', null)).toBe('2026-07-10')
    expect(billAmountLine('35,000 won', null)).toBe('35,000 won')
  })

  it.each([
    ['카카오페이 (카카오페이)', '카카오페이'],
    ['인터넷 지로（인터넷지로）', '인터넷 지로'],
    ['Wetax (WETAX)', 'Wetax'],
    [
      '카카오페이 (카카오페이)나 인터넷지로 (인터넷지로)로 내세요.',
      '카카오페이나 인터넷지로로 내세요.',
    ],
  ])('drops parentheses repeating the name: %s', (text, expected) => {
    expect(trimBillParentheses(text)).toBe(expected)
  })

  it.each([
    'Wetax (https://www.wetax.go.kr)',
    'Wetax (www.wetax.go.kr)',
    'ATM (07:00-23:30)',
    'Bank counter (농협, 기업은행)',
    'KakaoPay (카카오페이)',
    '위택스 (Wetax)',
    '카카오페이 (페이)',
    'CD/ATM (CDATM)',
    '(가상계좌)',
  ])('keeps any other parentheses: %s', (text) => {
    expect(trimBillParentheses(text)).toBe(text)
  })
})

describe('bill summary display', () => {
  const t = ((key: string) => key) as unknown as TFunction
  // 2026-11-27 in Korea, still 11-26 in UTC.
  const now = new Date('2026-11-26T16:00:00Z')

  it('counts the days to the deadline from the Korean date', () => {
    expect(billDDayLabel(t, '2026-12-04', now)).toBe('D-7')
    expect(billDDayLabel(t, '2026-11-27', now)).toBe('bill.today')
    expect(billDDayLabel(t, '2026-11-26', now)).toBe('bill.overdue')
    expect(billDDayLabel(t, null, now)).toBeNull()
  })

  it('formats the amount in won and keeps an unread amount empty', () => {
    expect(formatBillAmount(234000, 'ko')).toBe('₩234,000')
    expect(formatBillAmount(0, 'ko')).toBe('₩0')
    expect(formatBillAmount(null, 'ko')).toBeNull()
  })
})

describe('back from a bill result', () => {
  it('returns to the chat it was opened from', () => {
    expect(billBackPath({ from: '/chat/12' })).toBe('/chat/12')
    expect(billBackPath({ from: '/chat' })).toBe('/chat')
  })

  it.each([null, {}, { from: '/chat/0' }, { from: '/chat/history' }])(
    'returns to the upload screen for %o',
    (state) => {
      expect(billBackPath(state)).toBe('/translations/bills')
    },
  )
})

const checklistGuide: RelatedBillGuide = {
  code: 'CL-10',
  kind: 'CHECKLIST',
  title: '자동차세 내기',
}
const taskGuide: RelatedBillGuide = {
  code: 'LC-01-1',
  kind: 'LIFE_CHANGE_TASK',
  title: '체류지 변경 신고',
}
const ruleGuide: RelatedBillGuide = {
  code: 'tax-car',
  kind: 'RULE',
  title: '자동차세',
}

describe('related bill guides', () => {
  it('links checklist items the member has', () => {
    expect(
      visibleBillGuides(
        [checklistGuide, taskGuide],
        [{ code: 'CL-10' }, { code: 'LC-01-1' }],
      ),
    ).toEqual([checklistGuide, taskGuide])
    expect(billGuidePath(checklistGuide)).toBe('/home/checklist/CL-10')
  })

  it('hides checklist items missing from the member checklist', () => {
    expect(
      visibleBillGuides([checklistGuide, taskGuide], [{ code: 'CL-11' }]),
    ).toEqual([])
  })

  it('hides checklist items until the checklist is loaded', () => {
    expect(visibleBillGuides([checklistGuide, ruleGuide], undefined)).toEqual([
      ruleGuide,
    ])
  })

  it('hides every kind of guide without a title', () => {
    expect(
      visibleBillGuides(
        [
          { ...checklistGuide, title: null },
          { ...ruleGuide, title: null },
        ],
        [{ code: 'CL-10' }],
      ),
    ).toEqual([])
  })
})

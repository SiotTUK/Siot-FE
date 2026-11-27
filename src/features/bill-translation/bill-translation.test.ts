import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import type { RelatedBillGuide } from './api'
import {
  billDDayLabel,
  billGuidePath,
  formatBillAmount,
  visibleBillGuides,
} from './bill-translation'

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

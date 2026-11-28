import { describe, expect, it } from 'vitest'
import type { GuideSummaryResponse } from './api'
import { guideLabel, guideOptions } from './guide-list'

const guides: GuideSummaryResponse[] = [
  {
    code: 'CL-01',
    kind: 'CHECKLIST',
    title: '외국인등록',
    category: null,
    lifeChangeCode: null,
  },
  {
    code: 'LC-01-1',
    kind: 'LIFE_CHANGE_TASK',
    title: '체류지 변경 신고',
    category: null,
    lifeChangeCode: 'LC-01',
  },
  {
    code: 'waste-food',
    kind: 'RULE',
    title: null,
    category: 'waste',
    lifeChangeCode: null,
  },
]

describe('guide picker', () => {
  it('labels items with their code and Korean title', () => {
    expect(guideLabel(guides[0]!)).toBe('CL-01 · 외국인등록')
    expect(guideLabel(guides[2]!)).toBe('waste-food')
  })

  it('shows every item, or only the chosen kind, after a placeholder', () => {
    expect(guideOptions(guides, '', '', '고르세요')).toEqual([
      { value: '', label: '고르세요' },
      { value: 'CL-01', label: 'CL-01 · 외국인등록' },
      { value: 'LC-01-1', label: 'LC-01-1 · 체류지 변경 신고' },
      { value: 'waste-food', label: 'waste-food' },
    ])
    expect(
      guideOptions(guides, 'RULE', '', '-').map((option) => option.value),
    ).toEqual(['', 'waste-food'])
  })

  it('keeps a code opened by link even when it is not listed', () => {
    expect(
      guideOptions(guides, 'RULE', 'CL-01', '-').map((option) => option.label),
    ).toEqual(['-', 'CL-01 · 외국인등록', 'waste-food'])
    expect(guideOptions(guides, '', 'CL-99', '-')[1]).toEqual({
      value: 'CL-99',
      label: 'CL-99',
    })
  })
})

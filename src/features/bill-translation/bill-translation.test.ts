import { describe, expect, it } from 'vitest'
import type { RelatedBillGuide } from './api'
import { billGuidePath, visibleBillGuides } from './bill-translation'

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

import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import type { ChecklistItemResponse } from './api'
import {
  checklistItemKey,
  deadlineText,
  groupItems,
  homeHero,
  keepOrder,
  markErrorMessage,
  nextMark,
  openRequiredCount,
  optimisticStatus,
  pickDeadlineAlert,
} from './checklist'

const item = (over: Partial<ChecklistItemResponse>): ChecklistItemResponse => ({
  code: 'CL-01',
  title: '외국인등록',
  kind: 'CHECKLIST',
  itemType: 'REQUIRED',
  badge: null,
  place: null,
  docs: [],
  fee: null,
  law: null,
  penalty: null,
  contact: null,
  sourceUrl: null,
  sourceName: null,
  summary: null,
  content: null,
  variantBodies: [],
  deadline: null,
  dDay: null,
  dDayText: null,
  status: 'TODO',
  completed: false,
  periodKey: '',
  noticeChangedAt: null,
  hasNoticeChanged: false,
  applyStartsOn: null,
  highlighted: false,
  ...over,
})

describe('checklist screen rules', () => {
  it('keeps server order and folds optional items', () => {
    const list = [
      item({ code: 'CL-01' }),
      item({ code: 'CL-20', itemType: 'OPTIONAL' }),
      item({ code: 'CL-13', itemType: 'INFO' }),
    ]
    const { main, optional } = groupItems(list)
    expect(main.map((entry) => entry.code)).toEqual(['CL-01', 'CL-13'])
    expect(optional.map((entry) => entry.code)).toEqual(['CL-20'])
  })

  it('moves items marked not applicable to the bottom of their group', () => {
    const { main, optional } = groupItems([
      item({ code: 'CL-01', status: 'NOT_APPLICABLE' }),
      item({ code: 'CL-04' }),
      item({ code: 'CL-20', itemType: 'OPTIONAL', status: 'NOT_APPLICABLE' }),
      item({ code: 'CL-07', status: 'DONE' }),
      item({ code: 'CL-21', itemType: 'OPTIONAL' }),
    ])
    expect(main.map((entry) => entry.code)).toEqual(['CL-04', 'CL-07', 'CL-01'])
    expect(optional.map((entry) => entry.code)).toEqual(['CL-21', 'CL-20'])
  })

  it('alerts the nearest open deadline within 30 days only', () => {
    const alert = pickDeadlineAlert([
      item({ code: 'CL-05', dDay: 27, deadline: '2026-12-10' }),
      item({ code: 'CL-01', dDay: 5, deadline: '2026-11-18' }),
      item({ code: 'CL-10', dDay: 2, status: 'DONE' }),
      item({ code: 'CL-04' }),
    ])
    expect(alert?.code).toBe('CL-01')
    expect(pickDeadlineAlert([item({ dDay: 31 })])).toBeUndefined()
  })

  it('picks the home hero: urgent within 30 days, else calm with the next deadline', () => {
    expect(
      homeHero([
        item({ code: 'CL-05', dDay: 117, deadline: '2027-03-10' }),
        item({ code: 'CL-01', dDay: 5, deadline: '2026-11-18' }),
      ]),
    ).toMatchObject({ kind: 'urgent', item: { code: 'CL-01' } })
    expect(
      homeHero([
        item({ code: 'CL-05', dDay: 117, deadline: '2027-03-10' }),
        item({ code: 'CL-06', dDay: 200, deadline: '2027-06-15' }),
        item({ code: 'CL-04' }),
      ]),
    ).toMatchObject({ kind: 'calm', next: { code: 'CL-05' } })
    expect(
      homeHero([item({ code: 'CL-01', dDay: 40, status: 'DONE' })]),
    ).toEqual({ kind: 'calm', next: undefined })
  })

  it('counts required items still to do', () => {
    expect(
      openRequiredCount([
        item({ code: 'A' }),
        item({ code: 'B', status: 'OVERDUE' }),
        item({ code: 'C', status: 'DONE' }),
        item({ code: 'D', status: 'NOT_APPLICABLE' }),
        item({ code: 'E', itemType: 'OPTIONAL' }),
      ]),
    ).toBe(2)
  })

  it('counts a passed deadline as the most urgent', () => {
    expect(
      pickDeadlineAlert([
        item({ code: 'A', dDay: 3 }),
        item({ code: 'B', dDay: -2, status: 'OVERDUE' }),
      ])?.code,
    ).toBe('B')
  })

  it.each([
    ['TODO', 'toggleDone', 'DONE'],
    ['DONE', 'toggleDone', null],
    ['OVERDUE', 'toggleDone', 'DONE'],
    ['TODO', 'toggleNotApplicable', 'NOT_APPLICABLE'],
    ['NOT_APPLICABLE', 'toggleNotApplicable', null],
  ] as const)('%s + %s sends %s', (status, action, mark) => {
    expect(nextMark(item({ status }), action)).toBe(mark)
  })

  it('shows OVERDUE again when a passed item is unchecked', () => {
    expect(optimisticStatus(item({ dDay: -1 }), null)).toBe('OVERDUE')
    expect(optimisticStatus(item({ dDay: 4 }), null)).toBe('TODO')
    expect(optimisticStatus(item({ dDay: 4 }), 'DONE')).toBe('DONE')
  })

  it('localizes a past deadline even on closed cards and preserves other server text', () => {
    expect(
      deadlineText(
        item({ dDay: -1, dDayText: '기한 지남', status: 'DONE' }),
        'Overdue',
      ),
    ).toBe('Overdue')
    expect(deadlineText(item({ dDay: 3, dDayText: 'D-3' }), 'Overdue')).toBe(
      'D-3',
    )
  })

  it('keeps the order on screen after a refresh and appends new items', () => {
    const shown = [
      item({ code: 'A' }),
      item({ code: 'B' }),
      item({ code: 'C' }),
    ]
    // The server moved A (now done) to the end and added D.
    const fresh = [
      item({ code: 'B' }),
      item({ code: 'C' }),
      item({ code: 'D' }),
      item({ code: 'A', status: 'DONE' }),
    ]
    const kept = keepOrder(fresh, shown.map(checklistItemKey))
    expect(kept.map((entry) => entry.code)).toEqual(['A', 'B', 'C', 'D'])
    expect(kept[0]?.status).toBe('DONE')
  })

  it('treats the same item in another period as a different card', () => {
    const shown = [
      item({ code: 'CL-10', periodKey: '2026-06' }),
      item({ code: 'CL-10', periodKey: '2026-12' }),
    ]
    expect(
      keepOrder([...shown].reverse(), shown.map(checklistItemKey)).map(
        (entry) => entry.periodKey,
      ),
    ).toEqual(['2026-06', '2026-12'])
  })
})

describe('markErrorMessage', () => {
  const t = ((key: string) => key) as unknown as TFunction
  it('explains an item deleted after the list loaded', () => {
    expect(
      markErrorMessage(
        t,
        new ApiError(404, {
          code: 'GUIDE_NOT_FOUND',
          message: '항목을 찾을 수 없습니다.',
        }),
      ),
    ).toBe('checklist.itemGone')
  })
  it('keeps the shared message for other errors', () => {
    expect(
      markErrorMessage(
        t,
        new ApiError(400, { code: 'INVALID_INPUT', message: 'x' }),
      ),
    ).toBe('errors.INVALID_INPUT')
  })
})

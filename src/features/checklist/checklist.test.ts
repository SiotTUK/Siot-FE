import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import type { ChecklistItemResponse } from './api'
import {
  checklistItemKey,
  deadlineText,
  detailBackPath,
  dueSoon,
  groupItems,
  hasWarning,
  homeHero,
  keepOrder,
  lifeChangeOf,
  markErrorMessage,
  nextMark,
  openRequiredCount,
  optimisticStatus,
  pickDeadlineAlert,
  pickNextItem,
  reasonOf,
  translationPending,
  warningText,
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

  it('picks the open item with the first server deadline as next (H2)', () => {
    const next = pickNextItem([
      item({ code: 'CL-05', deadline: '2027-07-10', dDay: 225 }),
      item({ code: 'CL-01', deadline: '2027-01-18', dDay: 52, status: 'DONE' }),
      item({ code: 'CL-04', deadline: null, dDay: null }),
      item({ code: 'CL-06', deadline: '2027-03-10', dDay: 103 }),
      item({
        code: 'CL-07',
        deadline: '2027-02-01',
        dDay: 66,
        status: 'NOT_APPLICABLE',
      }),
    ])
    expect(next?.code).toBe('CL-06')
    expect(
      pickNextItem([
        item({ status: 'DONE', deadline: '2027-01-18', dDay: 52 }),
      ]),
    ).toBeUndefined()
  })

  it('explains car and school tasks of a life change (F06b)', () => {
    const task = (code: string, category: string) =>
      item({ code, kind: 'LIFE_CHANGE_TASK', category })
    expect(reasonOf(task('LC-01-3', 'CAR'))).toBe('CAR')
    expect(reasonOf(task('LC-01-4', 'EDUCATION'))).toBe('KIDS')
    // On the car and school changes themselves every task has that reason.
    expect(reasonOf(task('LC-04-1', 'CAR'))).toBeUndefined()
    expect(reasonOf(task('LC-03-1', 'EDUCATION'))).toBeUndefined()
    expect(reasonOf(task('LC-01-1', 'IMMIGRATION'))).toBeUndefined()
    expect(
      reasonOf(item({ code: 'CL-08', category: 'FAMILY' })),
    ).toBeUndefined()
  })

  it('shows "번역 준비 중" only when the server says translated is false', () => {
    // Korean fallback, or only the CL-04 condition text in Korean (BE #30).
    expect(
      translationPending(item({ contentLanguage: 'ko', translated: false })),
    ).toBe(true)
    expect(
      translationPending(item({ contentLanguage: 'en', translated: false })),
    ).toBe(true)
    expect(
      translationPending(item({ contentLanguage: null, translated: false })),
    ).toBe(true)
    expect(
      translationPending(item({ contentLanguage: 'en', translated: true })),
    ).toBe(false)
    // An older response without the flag shows nothing.
    expect(translationPending(item({}))).toBe(false)
  })

  it('finds the life change of a life-change task only', () => {
    expect(
      lifeChangeOf(item({ code: 'LC-01-1', kind: 'LIFE_CHANGE_TASK' })),
    ).toBe('LC-01')
    expect(
      lifeChangeOf(item({ code: 'LC-04-2', kind: 'LIFE_CHANGE_TASK' })),
    ).toBe('LC-04')
    expect(lifeChangeOf(item({ code: 'CL-01' }))).toBeUndefined()
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

  it('detects recent notice changes and detailed fields', () => {
    const target = item({
      code: 'CL-01',
      hasNoticeChanged: true,
      noticeChangedAt: '2026-11-03T09:00:00Z',
      place: '안산출입국·외국인사무소',
      docs: ['여권', '표준입학허가서'],
      fee: '30,000원',
      guideId: 101,
    })
    expect(target.hasNoticeChanged).toBe(true)
    expect(target.noticeChangedAt).toBe('2026-11-03T09:00:00Z')
    expect(target.docs).toHaveLength(2)
    expect(target.guideId).toBe(101)
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

describe('detailBackPath', () => {
  it('returns to the screen that opened the detail, else home', () => {
    expect(detailBackPath({ back: '/home/life-changes/LC-01' })).toBe(
      '/home/life-changes/LC-01',
    )
    expect(detailBackPath(null)).toBe('/home')
    expect(detailBackPath({ back: 'https://example.com' })).toBe('/home')
    expect(detailBackPath({ back: 42 })).toBe('/home')
  })
})

describe('CHK-08 warnings (#50)', () => {
  const registrationDue = {
    code: 'CL-01',
    dDay: 20,
    warning: true,
    warningType: 'REGISTRATION_DUE',
    warningMessage: 'Your foreigner registration deadline is within 30 days.',
  }

  it('warns only on items still to do', () => {
    expect(hasWarning(item(registrationDue))).toBe(true)
    // The BE keeps REGISTRATION_DUE on a completed CL-01.
    expect(hasWarning(item({ ...registrationDue, status: 'DONE' }))).toBe(false)
    expect(
      hasWarning(item({ ...registrationDue, status: 'NOT_APPLICABLE' })),
    ).toBe(false)
    expect(hasWarning(item({ dDay: 20 }))).toBe(false)
  })

  it('uses the server warning text, if any', () => {
    expect(warningText(item(registrationDue))).toBe(
      registrationDue.warningMessage,
    )
    expect(
      warningText(item({ ...registrationDue, warningMessage: null })),
    ).toBeUndefined()
    expect(
      warningText(item({ ...registrationDue, status: 'DONE' })),
    ).toBeUndefined()
  })

  it('marks due-soon rows but leaves overdue ones to the red D-day chip', () => {
    expect(dueSoon(item(registrationDue))).toBe(true)
    expect(
      dueSoon(
        item({
          dDay: -3,
          status: 'OVERDUE',
          warning: true,
          warningType: 'OVERDUE',
        }),
      ),
    ).toBe(false)
  })

  it('alerts a warned item before a nearer deadline the server does not warn about', () => {
    const alert = pickDeadlineAlert([
      item({ code: 'CL-09', dDay: 5, deadline: '2026-12-01' }),
      item({ ...registrationDue, deadline: '2026-12-16' }),
    ])
    expect(alert?.code).toBe('CL-01')
  })

  it('falls back to the nearest deadline within 30 days without warnings', () => {
    expect(
      pickDeadlineAlert([
        item({ ...registrationDue, status: 'DONE' }),
        item({ code: 'CL-09', dDay: 14, deadline: '2026-12-10' }),
      ])?.code,
    ).toBe('CL-09')
  })
})

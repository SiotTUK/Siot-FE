import { describe, expect, it } from 'vitest'
import type { EventCalendarItem } from '@/features/events/api'
import type { ScheduleResponse } from './api'
import type { TFunction } from 'i18next'
import {
  calendarEntries,
  dDayLabel,
  getCalendarWeek,
  httpUrl,
  isScheduledOn,
  nextSchedule,
} from './calendar'

const schedule: ScheduleResponse = {
  scheduleId: 1,
  guideId: null,
  kind: 'TAX',
  title: 'Tax schedule',
  startsOn: '2026-11-28',
  endsOn: '2026-12-02',
  targetDescription: null,
  sourceUrl: null,
  personal: false,
  highlighted: false,
}

describe('isScheduledOn', () => {
  it('includes both boundaries and dates inside a range crossing a month', () => {
    for (const date of ['2026-11-28', '2026-12-01', '2026-12-02']) {
      expect(isScheduledOn(schedule, date)).toBe(true)
    }
    expect(isScheduledOn(schedule, '2026-11-27')).toBe(false)
    expect(isScheduledOn(schedule, '2026-12-03')).toBe(false)
  })

  it('uses the start date as the only day when there is no end date', () => {
    const oneDay = { ...schedule, endsOn: null }
    expect(isScheduledOn(oneDay, '2026-11-28')).toBe(true)
    expect(isScheduledOn(oneDay, '2026-11-29')).toBe(false)
  })
})

describe('weekly schedule lines', () => {
  it('keeps a range continuous across its week and resumes it on the next row', () => {
    const { scheduleEntries } = calendarEntries([schedule], [])
    expect(
      getCalendarWeek(['2026-11-27', '2026-11-28'], scheduleEntries, []).lines,
    ).toMatchObject([{ firstDay: 1, lastDay: 1 }])
    expect(
      getCalendarWeek(
        ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03'],
        scheduleEntries,
        [],
      ).lines,
    ).toMatchObject([{ firstDay: 0, lastDay: 3 }])
  })

  it('places overlapping schedules on different lines and reuses free lines', () => {
    const overlapping = { ...schedule, startsOn: '2026-11-29', endsOn: null }
    const later = { ...schedule, startsOn: '2026-12-03', endsOn: null }
    const outside = { ...schedule, startsOn: '2026-11-27', endsOn: null }
    const { scheduleEntries } = calendarEntries(
      [overlapping, later, outside, schedule],
      [],
    )
    const { lines, laneCount } = getCalendarWeek(
      [
        '2026-11-28',
        '2026-11-29',
        '2026-11-30',
        '2026-12-01',
        '2026-12-02',
        '2026-12-03',
      ],
      scheduleEntries,
      [],
    )

    expect(laneCount).toBe(2)
    expect(lines.map(({ lane }) => lane)).toEqual([0, 1, 0])
  })
})

const event: EventCalendarItem = {
  eventId: 1,
  title: 'Event',
  startsOn: '2026-11-28',
  endsOn: '2026-12-02',
  region: 'SIHEUNG',
  translated: true,
}

describe('the combined calendar', () => {
  it('keeps source keys distinct and treats either single date as a one-day event', () => {
    const { all, eventEntries } = calendarEntries(
      [schedule],
      [
        { ...event, endsOn: null },
        { ...event, eventId: 2, startsOn: null },
        { ...event, eventId: 3, startsOn: null, endsOn: null },
      ],
    )
    expect(all.map(({ key }) => key)).toEqual([
      'schedule:1',
      'event:1',
      'event:2',
    ])
    expect(
      eventEntries.map(({ startsOn, endsOn }) => [startsOn, endsOn]),
    ).toEqual([
      ['2026-11-28', '2026-11-28'],
      ['2026-12-02', '2026-12-02'],
    ])
  })

  it('clips a line at the week and month while keeping the full event dates', () => {
    const { scheduleEntries, eventEntries } = calendarEntries([], [event])
    const november = getCalendarWeek(
      ['2026-11-27', '2026-11-28', '2026-11-29'],
      scheduleEntries,
      eventEntries,
    )
    const december = getCalendarWeek(
      ['2026-12-01', '2026-12-02', '2026-12-03'],
      scheduleEntries,
      eventEntries,
    )
    expect(november.lines).toMatchObject([{ firstDay: 1, lastDay: 2 }])
    expect(december.lines).toMatchObject([{ firstDay: 0, lastDay: 1 }])
    expect(december.lines[0].schedule).toMatchObject({
      startsOn: '2026-11-28',
      endsOn: '2026-12-02',
    })
  })

  it('caps combined lanes and counts hidden entries only on affected dates', () => {
    const { scheduleEntries, eventEntries, all } = calendarEntries(
      [schedule],
      [
        event,
        { ...event, eventId: 2 },
        { ...event, eventId: 3 },
        { ...event, eventId: 4, startsOn: '2026-12-02' },
      ],
    )
    const dates = ['2026-12-01', '2026-12-02', '2026-12-03']
    const week = getCalendarWeek(dates, scheduleEntries, eventEntries)
    expect(week.laneCount).toBe(3)
    expect(week.lines.map(({ lane }) => lane)).toEqual([0, 1, 2])
    expect(week.days).toEqual([
      { scheduleCount: 1, eventCount: 3, hidden: 1 },
      { scheduleCount: 1, eventCount: 4, hidden: 2 },
      { scheduleCount: 0, eventCount: 0, hidden: 0 },
    ])
    expect(all.filter((entry) => isScheduledOn(entry, dates[1]))).toHaveLength(
      5,
    )
  })

  it('reuses a living schedule lane on other days', () => {
    const { scheduleEntries, eventEntries } = calendarEntries(
      [{ ...schedule, startsOn: '2026-12-02', endsOn: null }],
      [{ ...event, startsOn: '2026-12-01', endsOn: '2026-12-01' }],
    )
    const week = getCalendarWeek(
      ['2026-12-01', '2026-12-02'],
      scheduleEntries,
      eventEntries,
    )
    expect(week.laneCount).toBe(1)
    expect(week.lines.map(({ lane }) => lane)).toEqual([0, 0])
  })

  it('also caps weeks that contain only living schedules', () => {
    const { scheduleEntries, eventEntries } = calendarEntries(
      [1, 2, 3, 4].map((scheduleId) => ({ ...schedule, scheduleId })),
      [],
    )
    const week = getCalendarWeek(
      ['2026-12-02', '2026-12-03'],
      scheduleEntries,
      eventEntries,
    )
    expect(week.laneCount).toBe(3)
    expect(week.days).toEqual([
      { scheduleCount: 4, eventCount: 0, hidden: 1 },
      { scheduleCount: 0, eventCount: 0, hidden: 0 },
    ])
  })
})

describe('next schedule for an empty month (#34)', () => {
  it('picks the first schedule starting after the month', () => {
    const at = (startsOn: string, title: string) => ({
      ...schedule,
      startsOn,
      endsOn: null,
      title,
    })
    expect(
      nextSchedule(
        [
          at('2026-12-16', 'car tax'),
          at('2026-11-05', 'this month'),
          at('2026-12-01', 'stay expiry'),
        ],
        '2026-11',
      )?.title,
    ).toBe('stay expiry')
    expect(nextSchedule([at('2026-11-30', 'past')], '2026-11')).toBeUndefined()
  })
})

describe('schedule labels', () => {
  const t = ((key: string, options?: { count?: number }) =>
    options?.count === undefined
      ? key
      : `${key}:${options.count}`) as unknown as TFunction

  it('turns the server D-day into a label', () => {
    expect(dDayLabel(t, 5)).toBe('calendar.tax.dDay:5')
    expect(dDayLabel(t, 0)).toBe('calendar.tax.dDayToday')
    expect(dDayLabel(t, -1)).toBe('calendar.tax.past')
    expect(dDayLabel(t, null)).toBeNull()
    expect(dDayLabel(t, undefined)).toBeNull()
  })

  it('links only http(s) addresses', () => {
    expect(httpUrl('https://www.wetax.go.kr')).toBe('https://www.wetax.go.kr/')
    expect(httpUrl('javascript:alert(1)')).toBeNull()
    expect(httpUrl('not a url')).toBeNull()
    expect(httpUrl(null)).toBeNull()
  })
})

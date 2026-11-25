import { describe, expect, it } from 'vitest'
import type { EventCalendarItem } from '@/features/events/api'
import type { ScheduleResponse } from './api'
import {
  calendarEntries,
  getCalendarWeek,
  getWeekScheduleLines,
  isScheduledOn,
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

describe('getWeekScheduleLines', () => {
  it('keeps a range continuous across its week and resumes it on the next row', () => {
    expect(
      getWeekScheduleLines(['2026-11-27', '2026-11-28'], [schedule]).lines,
    ).toMatchObject([{ firstDay: 1, lastDay: 1 }])
    expect(
      getWeekScheduleLines(
        ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03'],
        [schedule],
      ).lines,
    ).toMatchObject([{ firstDay: 0, lastDay: 3 }])
  })

  it('places overlapping schedules on different lines and reuses free lines', () => {
    const overlapping = { ...schedule, startsOn: '2026-11-29', endsOn: null }
    const later = { ...schedule, startsOn: '2026-12-03', endsOn: null }
    const outside = { ...schedule, startsOn: '2026-11-27', endsOn: null }
    const { lines, laneCount } = getWeekScheduleLines(
      [
        '2026-11-28',
        '2026-11-29',
        '2026-11-30',
        '2026-12-01',
        '2026-12-02',
        '2026-12-03',
      ],
      [overlapping, later, outside, schedule],
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

  it('caps event lanes separately and counts hidden entries only on affected dates', () => {
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
    expect(week.laneCount).toBe(4)
    expect(week.lines.map(({ lane }) => lane)).toEqual([0, 1, 2, 3])
    expect(week.days).toEqual([
      { total: 4, hidden: 0 },
      { total: 5, hidden: 1 },
      { total: 0, hidden: 0 },
    ])
    expect(all.filter((entry) => isScheduledOn(entry, dates[1]))).toHaveLength(
      5,
    )
  })
})

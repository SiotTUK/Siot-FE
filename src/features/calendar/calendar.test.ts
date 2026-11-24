import { describe, expect, it } from 'vitest'
import type { ScheduleResponse } from './api'
import { getWeekScheduleLines, isScheduledOn } from './calendar'

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

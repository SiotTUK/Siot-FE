import type { TFunction } from 'i18next'
import type { EventCalendarItem } from '@/features/events/api'
import type { ScheduleResponse } from './api'

type DateRange = Pick<ScheduleResponse, 'startsOn' | 'endsOn'>

type CalendarSchedule = DateRange & {
  key: string
  source: 'schedule'
  schedule: ScheduleResponse
}

type CalendarEvent = DateRange & {
  key: string
  source: 'event'
  event: EventCalendarItem
  endpointOnly: boolean
}

export function isScheduledOn(schedule: DateRange, date: string) {
  return (
    schedule.startsOn <= date && date <= (schedule.endsOn ?? schedule.startsOn)
  )
}

export function scheduleKey(schedule: ScheduleResponse) {
  return schedule.scheduleId ?? `${schedule.kind}:${schedule.startsOn}`
}

function getWeekRanges(
  dates: string[],
  schedules: (CalendarSchedule | CalendarEvent)[],
) {
  return schedules
    .map((schedule) => ({
      schedule,
      firstDay: dates.findIndex((date) => isScheduledOn(schedule, date)),
      lastDay: dates.findLastIndex((date) => isScheduledOn(schedule, date)),
    }))
    .filter(({ firstDay }) => firstDay !== -1)
    .sort((first, second) => first.firstDay - second.firstDay)
}

function spansCalendarMonth(startsOn: string, endsOn: string) {
  const anniversary = new Date(`${startsOn}T00:00:00Z`)
  const day = anniversary.getUTCDate()
  // Clamp to the last day if the next month is shorter (e.g. Jan 31 → Feb 28).
  anniversary.setUTCMonth(anniversary.getUTCMonth() + 2, 0)
  anniversary.setUTCDate(Math.min(day, anniversary.getUTCDate()))
  return new Date(`${endsOn}T00:00:00Z`) >= anniversary
}

export function calendarEntries(
  schedules: ScheduleResponse[],
  events: EventCalendarItem[],
) {
  const scheduleEntries = schedules.map<CalendarSchedule>((schedule) => ({
    key: `schedule:${scheduleKey(schedule)}`,
    source: 'schedule',
    startsOn: schedule.startsOn,
    endsOn: schedule.endsOn,
    schedule,
  }))
  const eventEntries = events.flatMap<CalendarEvent>((event) => {
    const startsOn = event.startsOn ?? event.endsOn
    if (!startsOn) return []
    const endsOn = event.endsOn ?? startsOn
    return [
      {
        key: `event:${event.eventId}`,
        source: 'event',
        startsOn,
        endsOn,
        event,
        endpointOnly: spansCalendarMonth(startsOn, endsOn),
      },
    ]
  })

  return {
    scheduleEntries,
    eventEntries,
    all: [...scheduleEntries, ...eventEntries].sort((a, b) =>
      a.startsOn.localeCompare(b.startsOn),
    ),
  }
}

const weekLaneLimit = 3

export function getCalendarWeek(
  dates: string[],
  schedules: CalendarSchedule[],
  events: CalendarEvent[],
) {
  // Give living schedules the first choice of lanes, then fill any gaps with events.
  const ranges = [
    ...getWeekRanges(dates, schedules),
    ...getWeekRanges(dates, events),
  ]
  const lanes = Array.from({ length: weekLaneLimit }, () =>
    Array<boolean>(dates.length).fill(false),
  )
  const days = dates.map(() => ({ scheduleCount: 0, eventCount: 0, hidden: 0 }))
  const lines = ranges.flatMap((range) => {
    const { schedule } = range
    // Day counts describe the full list shown when that date is selected.
    for (let day = range.firstDay; day <= range.lastDay; day++) {
      const count = days[day]
      if (schedule.source === 'event') count.eventCount++
      else count.scheduleCount++
    }

    let { firstDay, lastDay } = range
    if (schedule.source === 'event' && schedule.endpointOnly) {
      const endpoint = dates.findIndex(
        (date) => date === schedule.startsOn || date === schedule.endsOn,
      )
      if (endpoint === -1) return []
      firstDay = endpoint
      lastDay = endpoint
    }

    const lane = lanes.findIndex((occupied) =>
      occupied.slice(firstDay, lastDay + 1).every((day) => !day),
    )
    if (lane === -1) {
      for (let day = firstDay; day <= lastDay; day++) days[day].hidden++
      return []
    }

    lanes[lane].fill(true, firstDay, lastDay + 1)
    return [{ schedule, firstDay, lastDay, lane }]
  })

  return {
    lines,
    laneCount: lanes.filter((occupied) => occupied.some(Boolean)).length,
    days,
  }
}

/**
 * "다음 할 일" (#34): the first schedule starting after `month` (YYYY-MM).
 * A month without schedules has none overlapping it, so the start date is
 * enough.
 */
export function nextSchedule(schedules: ScheduleResponse[], month: string) {
  return schedules
    .filter((schedule) => schedule.startsOn.slice(0, 7) > month)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0]
}

/** Server D-day as a label: D-5, D-Day or "기한 지남"; null without one. */
export function dDayLabel(t: TFunction, dDay: number | null | undefined) {
  if (dDay == null) return null
  if (dDay < 0) return t('calendar.tax.past')
  if (dDay === 0) return t('calendar.tax.dDayToday')
  return t('calendar.tax.dDay', { count: dDay })
}

/** Only http(s) links from the server are shown as links. */
export function httpUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null
  } catch {
    return null
  }
}

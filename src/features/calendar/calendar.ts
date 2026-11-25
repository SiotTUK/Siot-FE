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
}

export function isScheduledOn(schedule: DateRange, date: string) {
  return (
    schedule.startsOn <= date && date <= (schedule.endsOn ?? schedule.startsOn)
  )
}

export function scheduleKey(schedule: ScheduleResponse) {
  return schedule.scheduleId ?? `${schedule.kind}:${schedule.startsOn}`
}

export function getWeekScheduleLines<T extends DateRange>(
  dates: string[],
  schedules: T[],
) {
  const ranges = schedules
    .map((schedule) => ({
      schedule,
      firstDay: dates.findIndex((date) => isScheduledOn(schedule, date)),
      lastDay: dates.findLastIndex((date) => isScheduledOn(schedule, date)),
    }))
    .filter(({ firstDay }) => firstDay !== -1)
    .sort((first, second) => first.firstDay - second.firstDay)

  const laneEnds: number[] = []
  const lines = ranges.map((range) => {
    const freeLane = laneEnds.findIndex((end) => end < range.firstDay)
    const lane = freeLane === -1 ? laneEnds.length : freeLane
    laneEnds[lane] = range.lastDay
    return { ...range, lane }
  })

  return { lines, laneCount: laneEnds.length }
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
    return [
      {
        key: `event:${event.eventId}`,
        source: 'event',
        startsOn,
        endsOn: event.endsOn ?? startsOn,
        event,
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

const eventLaneLimit = 3

export function getCalendarWeek(
  dates: string[],
  schedules: CalendarSchedule[],
  events: CalendarEvent[],
) {
  const scheduleWeek = getWeekScheduleLines(dates, schedules)
  const eventWeek = getWeekScheduleLines(dates, events)
  const allLines = [...scheduleWeek.lines, ...eventWeek.lines]
  const hiddenEvents = eventWeek.lines.filter(
    ({ lane }) => lane >= eventLaneLimit,
  )

  function countOnDay(lines: typeof allLines, index: number) {
    return lines.filter(
      ({ firstDay, lastDay }) => firstDay <= index && index <= lastDay,
    ).length
  }

  return {
    lines: [
      ...scheduleWeek.lines,
      ...eventWeek.lines
        .filter(({ lane }) => lane < eventLaneLimit)
        .map((line) => ({ ...line, lane: line.lane + scheduleWeek.laneCount })),
    ],
    laneCount:
      scheduleWeek.laneCount + Math.min(eventWeek.laneCount, eventLaneLimit),
    days: dates.map((_, index) => ({
      total: countOnDay(allLines, index),
      hidden: countOnDay(hiddenEvents, index),
    })),
  }
}

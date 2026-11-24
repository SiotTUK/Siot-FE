import type { ScheduleResponse } from './api'

export function isScheduledOn(schedule: ScheduleResponse, date: string) {
  return (
    schedule.startsOn <= date && date <= (schedule.endsOn ?? schedule.startsOn)
  )
}

export function scheduleKey(schedule: ScheduleResponse) {
  return schedule.scheduleId ?? `${schedule.kind}:${schedule.startsOn}`
}

export function getWeekScheduleLines(
  dates: string[],
  schedules: ScheduleResponse[],
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

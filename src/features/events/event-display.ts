import { formatCalendarDate, koreaToday } from '@/shared/i18n/format'
import type { EventSummary } from './api'

export function formatEventDates(event: EventSummary, language: string) {
  const start = event.startsOn && formatCalendarDate(event.startsOn, language)
  const end = event.endsOn && formatCalendarDate(event.endsOn, language)
  return start && end && start !== end ? `${start} – ${end}` : (start ?? end)
}

export function formatEventTimes(event: EventSummary, language: string) {
  if (event.timeUnknown) return ''
  const format = new Intl.DateTimeFormat(language, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  function timeLabel(value: string | null) {
    if (!value) return ''
    const time = new Date(`2000-01-01T${value}Z`)
    return Number.isNaN(time.getTime()) ? '' : format.format(time)
  }
  const start = timeLabel(event.startsAt)
  const end = timeLabel(event.endsAt)
  return start && end && start !== end ? `${start} – ${end}` : start || end
}

export function eventLink(value: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

/** Figma H1·M12 "곧 시작": a scheduled event starting within this many days. */
export const soonDays = 7

const dayMs = 24 * 60 * 60 * 1000

/**
 * Badge by the event's Korea dates: ongoing, soon (starts within
 * {@link soonDays} days), planned. Ended or undated events have none.
 */
export function eventStatus(
  event: Pick<EventSummary, 'startsOn' | 'endsOn'>,
  today = koreaToday(),
) {
  const startDate = event.startsOn ?? event.endsOn
  const endDate = event.endsOn ?? event.startsOn
  if (!startDate || !endDate || endDate < today) return undefined
  if (startDate <= today) return 'ongoing'
  const days =
    (Date.parse(`${startDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
    dayMs
  return days <= soonDays ? 'soon' : 'planned'
}

/** Collection time in Korea time, e.g. "11. 13. 03:00" (M12 "갱신 11.13 03:00"). */
export function formatCollectedAt(value: string, language: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Seoul',
  }).format(date)
}

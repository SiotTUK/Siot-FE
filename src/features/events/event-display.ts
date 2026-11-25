import { formatCalendarDate } from '@/shared/i18n/format'
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

/** Date and time in the reader's language, e.g. "2026. 11. 20. 오전 11:25". */
export function formatDateTime(
  value: string | null | undefined,
  language: string,
) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/** Calendar date (YYYY-MM-DD) as month and day in the reader's language, e.g. "11. 18." */
export function formatMonthDay(
  value: string | null | undefined,
  language: string,
) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

/** Calendar date (YYYY-MM-DD) with the month spelled out, e.g. "11월 18일", "November 18". */
export function formatLongMonthDay(value: string, language: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, {
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(date)
}

/** Year and month of a calendar date, e.g. "2027년 3월", "March 2027". */
export function formatYearMonth(value: string, language: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, {
        year: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(date)
}

/** A stored calendar date with its year, independent of the viewer's timezone. */
export function formatCalendarDate(value: string, language: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(date)
}

/** Date in Korea, in YYYY-MM-DD format. */
export function koreaToday(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

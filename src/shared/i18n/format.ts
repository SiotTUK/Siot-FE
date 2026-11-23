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

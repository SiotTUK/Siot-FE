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

export const firstCalendarMonth = '2000-01'
export const lastCalendarMonth = '2100-12'

export function readCalendarLocation(params: URLSearchParams, today: string) {
  const requestedMonth = params.get('month')
  const month =
    requestedMonth &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth) &&
    requestedMonth >= firstCalendarMonth &&
    requestedMonth <= lastCalendarMonth
      ? requestedMonth
      : today.slice(0, 7)
  const date = params.get('date')
  const parsedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00Z`)
      : null

  return {
    month,
    date:
      parsedDate &&
      Number.isFinite(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === date &&
      date?.startsWith(`${month}-`)
        ? date
        : null,
  }
}

export function calendarSearch(month: string, date: string | null) {
  const params = new URLSearchParams({ month })
  if (date) params.set('date', date)
  return params
}

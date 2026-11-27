export type EventStatus = 'ongoing' | 'scheduled' | 'ended'

/** EVE-10 list controls stored in the URL. */
export interface EventListFilters {
  status: EventStatus
  from: string | null
  to: string | null
}

export const defaultEventFilters: EventListFilters = {
  status: 'ongoing',
  from: null,
  to: null,
}

/** A real calendar date in yyyy-MM-dd, the format the BE accepts. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

/** Reads the filters kept in the list URL; malformed values are dropped. */
export function parseEventFilters(params: URLSearchParams): EventListFilters {
  const from = params.get('from')
  const to = params.get('to')
  const status = params.get('status')
  return {
    status:
      status === 'ongoing' || status === 'scheduled' || status === 'ended'
        ? status
        : params.get('past') === 'true'
          ? 'ended'
          : defaultEventFilters.status,
    from: isIsoDate(from) ? from : null,
    to: isIsoDate(to) ? to : null,
  }
}

/** The BE answers 400 INVALID_INPUT when from is later than to. */
export function isDateRangeValid({ from, to }: EventListFilters) {
  return !from || !to || from <= to
}

export function hasEventFilters(filters: EventListFilters) {
  return (
    filters.status !== defaultEventFilters.status ||
    filters.from !== null ||
    filters.to !== null
  )
}

/**
 * List URL after a filter change. Other params (e.g. region, category) stay,
 * and the page goes back to the first one.
 */
export function withEventFilters(
  params: URLSearchParams,
  filters: EventListFilters,
) {
  const next = new URLSearchParams(params)
  next.delete('page')
  next.delete('past')
  if (filters.status === defaultEventFilters.status) next.delete('status')
  else next.set('status', filters.status)
  for (const key of ['from', 'to'] as const) {
    const value = filters[key]
    if (value) next.set(key, value)
    else next.delete(key)
  }
  return next
}

/** Query string for GET /api/events. Defaults are left out. */
export function eventListQuery(page: number, filters: EventListFilters) {
  const query = new URLSearchParams({ page: String(page) })
  if (filters.status === 'ended') query.set('past', 'true')
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  return query.toString()
}

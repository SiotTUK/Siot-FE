export type EventStatus = 'ongoing' | 'scheduled' | 'ended'

/**
 * BE EventCategory (EVE-10). There is no list API; the values follow the
 * source classifications and change only with a BE release.
 */
export const eventCategories = [
  'FESTIVAL',
  'PERFORMANCE',
  'EXHIBITION',
  'EDUCATION',
  'EVENT',
] as const
export type EventCategory = (typeof eventCategories)[number]

export function isEventCategory(value: unknown): value is EventCategory {
  return eventCategories.some((category) => category === value)
}

/**
 * BE GET /api/events sort (BE #17): DATE starts soonest first (ended: ended
 * most recently first), DEADLINE puts open applications closing soonest
 * first, LATEST is newest registered first.
 */
export const eventSorts = ['DATE', 'DEADLINE', 'LATEST'] as const
export type EventSort = (typeof eventSorts)[number]

function isEventSort(value: unknown): value is EventSort {
  return eventSorts.some((sort) => sort === value)
}

/** EVE-10 list controls stored in the URL. */
export interface EventListFilters {
  status: EventStatus
  from: string | null
  to: string | null
  category: EventCategory | null
  /** Order, not a filter: resets keep it. */
  sort: EventSort
}

export const defaultEventFilters: EventListFilters = {
  status: 'ongoing',
  from: null,
  to: null,
  category: null,
  sort: 'DATE',
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
  const category = params.get('category')
  const sort = params.get('sort')
  return {
    status:
      status === 'ongoing' || status === 'scheduled' || status === 'ended'
        ? status
        : params.get('past') === 'true'
          ? 'ended'
          : defaultEventFilters.status,
    from: isIsoDate(from) ? from : null,
    to: isIsoDate(to) ? to : null,
    category: isEventCategory(category) ? category : null,
    sort: isEventSort(sort) ? sort : defaultEventFilters.sort,
  }
}

/** The BE answers 400 INVALID_INPUT when from is later than to. */
export function isDateRangeValid({ from, to }: EventListFilters) {
  return !from || !to || from <= to
}

export function hasEventFilters(filters: EventListFilters) {
  return filters.status !== defaultEventFilters.status || hasNarrowing(filters)
}

/** Category or period narrows the chosen status (M13 "조건에 맞는 행사가 없어요"). */
export function hasNarrowing({ from, to, category }: EventListFilters) {
  return from !== null || to !== null || category !== null
}

/** Clears every filter; the order stays. */
export function resetEventFilters(filters: EventListFilters) {
  return { ...defaultEventFilters, sort: filters.sort }
}

/** M13 "필터 초기화": drops category and period, keeps status and order. */
export function clearNarrowing(filters: EventListFilters) {
  return { ...filters, from: null, to: null, category: null }
}

/**
 * Scheduled events (and ongoing ones in a future period) are split out of the
 * BE's DATE order on the client (event-list-page.ts), so only DATE works there.
 */
export function isSortAvailable(filters: EventListFilters, today: string) {
  if (filters.status === 'ended') return true
  if (filters.status === 'scheduled') return false
  return !(filters.from && filters.from > today)
}

/**
 * List URL after a filter change. Other params (e.g. region) stay,
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
  for (const key of ['from', 'to', 'category'] as const) {
    const value = filters[key]
    if (value) next.set(key, value)
    else next.delete(key)
  }
  if (filters.sort === defaultEventFilters.sort) next.delete('sort')
  else next.set('sort', filters.sort)
  return next
}

/** Query string for GET /api/events. Defaults are left out. */
export function eventListQuery(page: number, filters: EventListFilters) {
  const query = new URLSearchParams({ page: String(page) })
  if (filters.status === 'ended') query.set('past', 'true')
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  if (filters.category) query.set('category', filters.category)
  if (filters.sort !== defaultEventFilters.sort) query.set('sort', filters.sort)
  return query.toString()
}

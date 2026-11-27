import type { PageResponse } from '@/shared/api/types'
import type { EventSummary } from './api'
import type { EventStatus } from './event-filters'

type EventPage = PageResponse<EventSummary>
type FetchPage = (page: number) => Promise<EventPage>

export function emptyEventListPage(page: number): EventPage {
  return {
    content: [],
    page,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
  }
}

/** The BE's DATE order puts ongoing events before all scheduled events. */
async function findScheduledBoundary(
  first: EventPage,
  today: string,
  fetchPage: FetchPage,
) {
  const scheduledIndex = (events: EventSummary[]) =>
    events.findIndex(
      ({ startsOn, endsOn }) => (startsOn ?? endsOn ?? '') > today,
    )

  const index = scheduledIndex(first.content)
  if (index !== -1) return { page: first, index }

  let boundary: { page: EventPage; index: number } | undefined
  let low = 1
  let high = first.totalPages - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const candidate = await fetchPage(middle)
    const candidateIndex = scheduledIndex(candidate.content)
    if (candidateIndex === -1) {
      low = middle + 1
    } else {
      boundary = { page: candidate, index: candidateIndex }
      high = middle - 1
    }
  }
  return boundary
}

export async function fetchActiveEventPage(
  page: number,
  today: string,
  status: Exclude<EventStatus, 'ended'>,
  fetchPage: FetchPage,
): Promise<EventPage> {
  const first = await fetchPage(0)
  const { size } = first
  const boundary = await findScheduledBoundary(first, today, fetchPage)
  const ongoingCount = boundary
    ? boundary.page.page * size + boundary.index
    : first.totalElements
  const scheduled = status === 'scheduled'
  const totalElements = scheduled
    ? first.totalElements - ongoingCount
    : ongoingCount
  const totalPages = Math.ceil(totalElements / size)
  const hasNext = page + 1 < totalPages
  const content: EventSummary[] = []

  if (page < totalPages) {
    const offset = (scheduled ? ongoingCount : 0) + page * size
    const serverPage = Math.floor(offset / size)
    const index = offset % size
    const count = Math.min(size, totalElements - page * size)
    const current =
      serverPage === 0
        ? first
        : boundary?.page.page === serverPage
          ? boundary.page
          : await fetchPage(serverPage)
    content.push(...current.content.slice(index, index + count))
    if (content.length < count) {
      const next = await fetchPage(serverPage + 1)
      content.push(...next.content.slice(0, count - content.length))
    }
  }

  return { content, page, size, totalElements, totalPages, hasNext }
}

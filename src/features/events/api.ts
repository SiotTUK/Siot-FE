import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'
import { eventListQuery, type EventListFilters } from './event-filters'

export interface EventSummary {
  eventId: number
  title: string
  venue: string | null
  thumbnailUrl?: string | null
  startsOn: string | null
  endsOn: string | null
  startsAt: string | null
  endsAt: string | null
  timeUnknown: boolean
  region: string | null
  multicultural: boolean
  language: Language
  translated: boolean
}

export interface EventDetail extends EventSummary {
  description: string | null
  priceInfo: string | null
  applicationDeadline: string | null
  applicationUrl: string | null
  sourceUrl: string | null
  subscribed: boolean
}

export interface EventRecommendation {
  event: EventSummary
  reasons: string[]
}

export interface EventCalendarItem {
  eventId: number
  title: string
  startsOn: string | null
  endsOn: string | null
  region: string | null
  translated: boolean
}

export const eventKeys = {
  all: ['events'] as const,
  member: (memberId: number) => [...eventKeys.all, memberId] as const,
  recommendations: (memberId: number) =>
    [...eventKeys.member(memberId), 'recommendations'] as const,
  list: (memberId: number, page: number, filters: EventListFilters) =>
    [...eventKeys.member(memberId), 'list', filters, page] as const,
  calendar: (memberId: number, year: number, month: number) =>
    [...eventKeys.member(memberId), 'calendar', year, month] as const,
  detail: (memberId: number, eventId: string) =>
    [...eventKeys.member(memberId), 'detail', eventId] as const,
}

// The server localizes response text using the signed-in member's language.
export function fetchEventRecommendations(signal?: AbortSignal) {
  return apiRequest<EventRecommendation[]>('/api/events/recommendations', {
    signal,
  })
}

export function fetchEvents(
  page: number,
  filters: EventListFilters,
  signal?: AbortSignal,
) {
  return apiRequest<PageResponse<EventSummary>>(
    `/api/events?${eventListQuery(page, filters)}`,
    { signal },
  )
}

export function fetchEventDetail(eventId: string, signal?: AbortSignal) {
  return apiRequest<EventDetail>(`/api/events/${eventId}`, { signal })
}

export function fetchEventCalendar(
  year: number,
  month: number,
  signal?: AbortSignal,
) {
  return apiRequest<EventCalendarItem[]>(
    `/api/events/calendar?year=${year}&month=${month}`,
    { signal },
  )
}

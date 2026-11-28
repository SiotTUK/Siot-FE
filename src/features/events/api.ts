import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'
import {
  eventListQuery,
  type EventCategory,
  type EventListFilters,
} from './event-filters'
import { emptyEventListPage, fetchActiveEventPage } from './event-list-page'

export interface EventSummary {
  eventId: number
  title: string
  venue: string | null
  /** Event photo URL; null when the source has none (BE #19). */
  thumbnailUrl: string | null
  startsOn: string | null
  endsOn: string | null
  startsAt: string | null
  endsAt: string | null
  timeUnknown: boolean
  region: string | null
  /** EVE-10; categoryName is in the member's language. */
  category: EventCategory
  categoryName: string
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
  category: EventCategory
  categoryName: string
  translated: boolean
}

export const eventLeadDays = [1, 3, 7] as const
export type EventLeadDays = (typeof eventLeadDays)[number]

export interface EventSubscriptionStatus {
  subscribed: boolean
  leadDays: EventLeadDays | null
}

interface EventSubscriptionResponse {
  eventId: number
  userId: number
  enabled: boolean
  updatedAt: string
  leadDays: EventLeadDays
}

export const eventKeys = {
  all: ['events'] as const,
  member: (memberId: number) => [...eventKeys.all, memberId] as const,
  recommendations: (memberId: number) =>
    [...eventKeys.member(memberId), 'recommendations'] as const,
  lists: (memberId: number) => [...eventKeys.member(memberId), 'list'] as const,
  list: (
    memberId: number,
    page: number,
    filters: EventListFilters,
    today: string,
  ) => [...eventKeys.lists(memberId), filters, today, page] as const,
  saved: (memberId: number) =>
    [...eventKeys.member(memberId), 'saved'] as const,
  subscription: (memberId: number, eventId: string) =>
    [...eventKeys.member(memberId), 'subscription', eventId] as const,
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
  today: string,
  signal?: AbortSignal,
) {
  const fetchPage = (pageNumber: number, query = filters) =>
    apiRequest<PageResponse<EventSummary>>(
      `/api/events?${eventListQuery(pageNumber, query)}`,
      { signal },
    )

  if (filters.status === 'ended') return fetchPage(page)
  if (filters.status === 'scheduled') {
    return filters.to && filters.to <= today
      ? Promise.resolve(emptyEventListPage(page))
      : fetchActiveEventPage(page, today, 'scheduled', fetchPage)
  }

  // A future period can still overlap a currently running event.
  if (filters.from && filters.from > today)
    return fetchActiveEventPage(page, today, 'ongoing', fetchPage)

  // The non-past endpoint already checks the end date. Cap the start date at today.
  const to = filters.to && filters.to < today ? filters.to : today
  return fetchPage(page, { ...filters, to })
}

export function fetchEventDetail(eventId: string, signal?: AbortSignal) {
  return apiRequest<EventDetail>(`/api/events/${eventId}`, { signal })
}

export function fetchEventCalendar(
  year: number,
  month: number,
  signal?: AbortSignal,
  category?: EventCategory,
) {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  })
  if (category) query.set('category', category)
  return apiRequest<EventCalendarItem[]>(`/api/events/calendar?${query}`, {
    signal,
  })
}

export function fetchEventSubscription(eventId: string, signal?: AbortSignal) {
  return apiRequest<EventSubscriptionStatus>(
    `/api/events/${eventId}/subscriptions`,
    {
      signal,
    },
  )
}

export async function saveEventSubscription(
  eventId: string,
  leadDays: EventLeadDays | null,
  isRequestCurrent: () => boolean,
): Promise<EventSubscriptionStatus> {
  const path = `/api/events/${eventId}/subscriptions` as const
  const result = await apiRequest<EventSubscriptionResponse>(
    leadDays === null ? path : `${path}?leadDays=${leadDays}`,
    { method: leadDays === null ? 'DELETE' : 'POST', isRequestCurrent },
  )
  return {
    subscribed: result.enabled,
    leadDays: result.enabled ? result.leadDays : null,
  }
}

/**
 * Events the member saved (♥ = subscribed), newest first. One page of 100
 * covers the ♥ state on cards; GET /api/members/me/event-subscriptions.
 */
export async function fetchSavedEventIds(signal?: AbortSignal) {
  const page = await apiRequest<PageResponse<EventSubscriptionResponse>>(
    '/api/members/me/event-subscriptions?size=100',
    { signal },
  )
  return page.content.filter((item) => item.enabled).map((item) => item.eventId)
}

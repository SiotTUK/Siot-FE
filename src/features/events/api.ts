import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'

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
  list: (memberId: number, page: number) =>
    [...eventKeys.lists(memberId), page] as const,
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

export function fetchEvents(page: number, signal?: AbortSignal) {
  return apiRequest<PageResponse<EventSummary>>(`/api/events?page=${page}`, {
    signal,
  })
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

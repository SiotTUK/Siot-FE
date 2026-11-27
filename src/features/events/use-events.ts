import { useQuery } from '@tanstack/react-query'
import { koreaToday } from '@/shared/i18n/format'
import {
  eventKeys,
  fetchEventCalendar,
  fetchEventDetail,
  fetchEventRecommendations,
  fetchEvents,
} from './api'
import { isDateRangeValid, type EventListFilters } from './event-filters'

export function useEventRecommendations(memberId: number) {
  return useQuery({
    queryKey: eventKeys.recommendations(memberId),
    queryFn: ({ signal }) => fetchEventRecommendations(signal),
  })
}

export function useEvents(
  memberId: number,
  page: number,
  filters: EventListFilters,
) {
  const today = koreaToday()
  return useQuery({
    queryKey: eventKeys.list(memberId, page, filters, today),
    queryFn: ({ signal }) => fetchEvents(page, filters, today, signal),
    // The server rejects from > to with 400; the screen shows that error first.
    enabled: isDateRangeValid(filters),
  })
}

export function useEventDetail(memberId: number, eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(memberId, eventId),
    queryFn: ({ signal }) => fetchEventDetail(eventId, signal),
  })
}

export function useEventCalendar(
  memberId: number,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: eventKeys.calendar(memberId, year, month),
    queryFn: ({ signal }) => fetchEventCalendar(year, month, signal),
  })
}

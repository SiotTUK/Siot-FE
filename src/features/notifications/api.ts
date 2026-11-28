import { apiRequest } from '@/shared/api/client'
import type { PageResponse } from '@/shared/api/types'

/** BE NotificationResponse (NTF-04). Text comes in the member's language. */
export interface NotificationItem {
  notificationId: number
  /**
   * STAY_EXPIRY · REGISTRATION · RESIDENCE_REPORT · TAX · EVENT ·
   * NOTICE_CHANGED · BILL_DUE (BE NotificationResponse). CHECKLIST_DEADLINE
   * is a preference kind only.
   */
  kind: string
  eventId: number | null
  guideId: number | null
  scheduleId: number | null
  documentVersionId: number | null
  /**
   * Where the notification points (BE 69d9909): EVENT · CHECKLIST ·
   * LIFE_CHANGE_TASK · RULE · SCHEDULE · CALENDAR.
   */
  linkType: string | null
  /** eventId, item code (CL-01 …) or scheduleId; null for CALENDAR. */
  linkCode: string | null
  title: string
  body: string | null
  locale: string | null
  status: string
  scheduledAt: string | null
  deliveredAt: string | null
  readAt: string | null
  read: boolean
  emailStatus: string | null
  createdAt: string
}

/** BE NotificationPreferenceResponse (NTF-03, NTF-05). */
export interface NotificationPreference {
  kind: string
  enabled: boolean
  /** Deprecated: stored but not used for sending. Sent back as read. */
  leadDays: number
  /** NTF-05 also by email (needs a verified sign-up email). */
  emailEnabled: boolean
  /** D-n reminders actually sent, largest first. Empty for EVENT·NOTICE_CHANGED. */
  leadDaysList: number[]
  /** D-n this kind can pick (STAY_EXPIRY 120·60·30·14·7·1, CHECKLIST_DEADLINE·TAX 7·1). */
  availableLeadDays: number[]
}

/**
 * BE NotificationPreferenceUpdateRequest. `emailEnabled` and
 * `leadDaysList` left out keep their saved values.
 */
export interface NotificationPreferenceUpdate {
  kind: string
  enabled: boolean
  leadDays: number
  emailEnabled?: boolean
  leadDaysList?: number[]
}

/** Keyed by member so another account never sees cached notifications. */
export const notificationKeys = {
  all: ['notifications'] as const,
  member: (memberId: number) => [...notificationKeys.all, memberId] as const,
  list: (memberId: number) =>
    [...notificationKeys.member(memberId), 'list'] as const,
  unread: (memberId: number) =>
    [...notificationKeys.member(memberId), 'unread'] as const,
  preferences: (memberId: number) =>
    [...notificationKeys.member(memberId), 'preferences'] as const,
}

const base = '/api/members/me/notifications'

export function fetchNotifications(page: number, signal?: AbortSignal) {
  return apiRequest<PageResponse<NotificationItem>>(
    `${base}?page=${page}&size=20`,
    { signal },
  )
}

export function fetchUnreadCount(signal?: AbortSignal) {
  return apiRequest<{ unreadCount: number }>(`${base}/unread-count`, {
    signal,
  })
}

export function fetchPreferences(signal?: AbortSignal) {
  return apiRequest<NotificationPreference[]>(`${base}/preferences`, {
    signal,
  })
}

/**
 * Send leadDays back as read: the BE stores 0 when it is missing.
 * `isRequestCurrent` stops the write if the login session changed meanwhile.
 */
export function updatePreference(
  preference: NotificationPreferenceUpdate,
  isRequestCurrent: () => boolean,
) {
  return apiRequest<NotificationPreference>(`${base}/preferences`, {
    method: 'PUT',
    body: preference,
    isRequestCurrent,
  })
}

export function markNotificationRead(
  notificationId: number,
  isRequestCurrent: () => boolean,
) {
  return apiRequest<NotificationItem>(`${base}/${notificationId}/read`, {
    method: 'PATCH',
    isRequestCurrent,
  })
}

/** Marks every notification read (204). */
export function markAllNotificationsRead(isRequestCurrent: () => boolean) {
  return apiRequest<void>(`${base}/read-all`, {
    method: 'PATCH',
    isRequestCurrent,
  })
}

import { apiRequest } from '@/shared/api/client'
import type { PageResponse } from '@/shared/api/types'

/** BE NotificationResponse (NTF-04). Text comes in the member's language. */
export interface NotificationItem {
  notificationId: number
  /** STAY_EXPIRY · CHECKLIST_DEADLINE · TAX · EVENT · NOTICE_CHANGED … */
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

/** BE NotificationPreferenceResponse (NTF-03). */
export interface NotificationPreference {
  kind: string
  enabled: boolean
  /** Saved by the BE, but the sending schedule is still fixed (D-7·D-1). */
  leadDays: number
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
  preference: NotificationPreference,
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

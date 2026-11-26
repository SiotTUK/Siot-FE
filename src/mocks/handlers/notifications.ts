import { http, HttpResponse } from 'msw'
import type { NotificationItem } from '@/features/notifications/api'
import { body, currentMember, error, persist, state, unauthorized } from '../db'

const path = '*/api/members/me/notifications'
const hour = 60 * 60 * 1000

/**
 * Four sample notifications per member, like Figma M09 (dev/test only;
 * the BE writes real ones from its schedules). Read times live in state.
 */
function notificationsFor(email: string): NotificationItem[] {
  const reads = state.notificationReads[email] ?? {}
  const now = Date.now()
  const seeds = [
    {
      id: 4,
      kind: 'STAY_EXPIRY',
      linkType: 'CALENDAR',
      title: '체류기간 만료 34일 전이에요. 연장 신청을 할 수 있어요.',
      ago: 1,
    },
    {
      id: 3,
      kind: 'EVENT',
      eventId: 2,
      linkType: 'EVENT',
      linkCode: '2',
      title: '「시흥갯골축제」 일정이 바뀌었어요.',
      ago: 26,
    },
    {
      id: 2,
      kind: 'NOTICE_CHANGED',
      guideId: 1,
      linkType: 'CHECKLIST',
      linkCode: 'CL-01',
      title: '「외국인등록」 준비물이 바뀌었어요.',
      ago: 24 * 5,
    },
    {
      id: 1,
      kind: 'EVENT',
      eventId: 3,
      linkType: 'EVENT',
      linkCode: '3',
      title: '「세계인의 날」 신청 마감 3일 전',
      ago: 24 * 9,
      readAgo: 24 * 8,
    },
  ]
  return seeds.map((seed) => {
    const createdAt = new Date(now - seed.ago * hour).toISOString()
    const readAt =
      reads[seed.id] ??
      (seed.readAgo ? new Date(now - seed.readAgo * hour).toISOString() : null)
    return {
      notificationId: seed.id,
      kind: seed.kind,
      eventId: seed.eventId ?? null,
      guideId: seed.guideId ?? null,
      scheduleId: null,
      documentVersionId: null,
      linkType: seed.linkType,
      linkCode: seed.linkCode ?? null,
      title: seed.title,
      body: null,
      locale: 'ko',
      status: 'SENT',
      scheduledAt: null,
      deliveredAt: createdAt,
      readAt,
      read: readAt !== null,
      emailStatus: null,
      createdAt,
    }
  })
}

/** Same kinds and defaults as BE NotificationService.getPreferences. */
const defaultLeadDays: Record<string, number> = {
  STAY_EXPIRY: 30,
  CHECKLIST_DEADLINE: 7,
  TAX: 7,
  EVENT: 1,
  NOTICE_CHANGED: 0,
}

function preferencesFor(email: string) {
  const saved = state.notificationPrefs[email] ?? {}
  return Object.entries(defaultLeadDays).map(([kind, leadDays]) => ({
    kind,
    enabled: saved[kind]?.enabled ?? true,
    leadDays: saved[kind]?.leadDays ?? leadDays,
  }))
}

export const notificationHandlers = [
  http.get(`${path}/preferences`, () => {
    const member = currentMember()
    if (!member) return unauthorized()
    return HttpResponse.json({ data: preferencesFor(member.email) })
  }),

  http.put(`${path}/preferences`, async ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const input = await body(request)
    const kind = typeof input.kind === 'string' ? input.kind.toUpperCase() : ''
    if (!kind || typeof input.enabled !== 'boolean')
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    // Like the BE: a missing leadDays is stored as 0.
    const leadDays = typeof input.leadDays === 'number' ? input.leadDays : 0
    ;(state.notificationPrefs[member.email] ??= {})[kind] = {
      enabled: input.enabled,
      leadDays,
    }
    persist()
    return HttpResponse.json({
      data: { kind, enabled: input.enabled, leadDays },
    })
  }),

  http.get(path, ({ request }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const all = notificationsFor(member.email)
    const content = all.slice(page * size, page * size + size)
    return HttpResponse.json({
      data: {
        content,
        page,
        size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
        hasNext: (page + 1) * size < all.length,
      },
    })
  }),

  http.get(`${path}/unread-count`, () => {
    const member = currentMember()
    if (!member) return unauthorized()
    const unreadCount = notificationsFor(member.email).filter(
      (item) => !item.read,
    ).length
    return HttpResponse.json({ data: { unreadCount } })
  }),

  http.patch(`${path}/:id/read`, ({ params }) => {
    const member = currentMember()
    if (!member) return unauthorized()
    const id = Number(params.id)
    const found = notificationsFor(member.email).find(
      (item) => item.notificationId === id,
    )
    if (!found)
      return error(404, 'NOTIFICATION_NOT_FOUND', '알림을 찾을 수 없습니다.')
    if (!found.read) {
      ;(state.notificationReads[member.email] ??= {})[id] =
        new Date().toISOString()
      persist()
    }
    return HttpResponse.json({
      data: notificationsFor(member.email).find(
        (item) => item.notificationId === id,
      ),
    })
  }),
]

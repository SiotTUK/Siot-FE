import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { server } from '@/test/setup'
import {
  fetchNotifications,
  fetchPreferences,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updatePreference,
} from './api'
import { notificationGroup } from './notifications'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const base = '/api/members/me/notifications'
const current = () => true

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      interceptedFetch(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('notifications contract', () => {
  it('requires login', async () => {
    await expect(fetchUnreadCount()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })

  it('lists newest first and counts unread ones', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const page = await fetchNotifications(0)
    const times = page.content.map((item) => Date.parse(item.createdAt))
    expect(times).toEqual([...times].sort((a, b) => b - a))
    const unread = page.content.filter((item) => !item.read).length
    expect(await fetchUnreadCount()).toEqual({ unreadCount: unread })
  })

  it('groups the BE deadline kinds as 생활 마감 (FE #52)', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const kinds = (await fetchNotifications(0)).content.map((item) => item.kind)
    for (const kind of ['REGISTRATION', 'RESIDENCE_REPORT', 'BILL_DUE']) {
      expect(kinds).toContain(kind)
      expect(notificationGroup(kind)).toBe('deadline')
    }
  })

  it('reads and saves preferences, keeping leadDays when sent back', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const prefs = await fetchPreferences()
    expect(prefs.map((pref) => pref.kind)).toEqual([
      'STAY_EXPIRY',
      'CHECKLIST_DEADLINE',
      'TAX',
      'EVENT',
      'NOTICE_CHANGED',
    ])
    const stay = prefs.find((pref) => pref.kind === 'STAY_EXPIRY')!
    expect(
      await updatePreference({ ...stay, enabled: false }, current),
    ).toMatchObject({
      kind: 'STAY_EXPIRY',
      enabled: false,
      leadDays: 30,
    })
    expect(
      (await fetchPreferences()).find((pref) => pref.kind === 'STAY_EXPIRY'),
    ).toMatchObject({ kind: 'STAY_EXPIRY', enabled: false, leadDays: 30 })
  })

  it('saves email and D-n reminders, keeping what is left out', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const tax = (await fetchPreferences()).find((pref) => pref.kind === 'TAX')!
    expect(tax).toMatchObject({
      emailEnabled: true,
      leadDaysList: [7, 1],
      availableLeadDays: [7, 1],
    })
    await updatePreference(
      { kind: 'TAX', enabled: true, leadDays: tax.leadDays, leadDaysList: [7] },
      current,
    )
    const saved = await updatePreference(
      {
        kind: 'TAX',
        enabled: true,
        leadDays: tax.leadDays,
        emailEnabled: false,
      },
      current,
    )
    expect(saved).toMatchObject({ emailEnabled: false, leadDaysList: [7] })
    await expect(
      updatePreference(
        { kind: 'TAX', enabled: true, leadDays: 7, leadDaysList: [30] },
        current,
      ),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INPUT' })
    await expect(
      updatePreference(
        {
          kind: 'NOTICE_CHANGED',
          enabled: true,
          leadDays: 0,
          leadDaysList: [1],
        },
        current,
      ),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('marks every notification read', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    expect((await fetchUnreadCount()).unreadCount).toBeGreaterThan(0)
    await markAllNotificationsRead(current)
    expect((await fetchUnreadCount()).unreadCount).toBe(0)
    const page = await fetchNotifications(0)
    expect(page.content.every((item) => item.read)).toBe(true)
  })

  it('marks one read, lowers the count and rejects unknown ids', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const before = (await fetchUnreadCount()).unreadCount
    const target = (await fetchNotifications(0)).content.find(
      (item) => !item.read,
    )!
    const updated = await markNotificationRead(target.notificationId, current)
    expect(updated).toMatchObject({
      notificationId: target.notificationId,
      read: true,
    })
    expect(updated.readAt).not.toBeNull()
    expect((await fetchUnreadCount()).unreadCount).toBe(before - 1)
    // Marking again keeps it read and the count unchanged.
    await markNotificationRead(target.notificationId, current)
    expect((await fetchUnreadCount()).unreadCount).toBe(before - 1)
    await expect(markNotificationRead(9999, current)).rejects.toMatchObject({
      status: 404,
      code: 'NOTIFICATION_NOT_FOUND',
    })
  })

  it('stops PUT and PATCH from being retried after CSRF refresh changes the session', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const pref = { kind: 'TAX', enabled: false, leadDays: 7 }
    for (const method of ['PUT', 'PATCH'] as const) {
      let active = true
      const reject = vi.fn(() =>
        HttpResponse.json(
          { code: 'CSRF_TOKEN_INVALID', message: 'CSRF' },
          { status: 403 },
        ),
      )
      server.use(
        method === 'PUT'
          ? http.put(`${origin}${base}/preferences`, reject)
          : http.patch(`${origin}${base}/1/read`, reject),
        http.get(`${origin}/api/auth/csrf`, () => {
          active = false
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const request =
        method === 'PUT'
          ? updatePreference(pref, () => active)
          : markNotificationRead(1, () => active)
      await expect(request).rejects.toMatchObject({ name: 'AbortError' })
      expect(reject).toHaveBeenCalledTimes(1)
    }
  })
})

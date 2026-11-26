import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import {
  fetchNotifications,
  fetchPreferences,
  fetchUnreadCount,
  markNotificationRead,
  updatePreference,
} from './api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'

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
    expect(await updatePreference({ ...stay, enabled: false })).toEqual({
      kind: 'STAY_EXPIRY',
      enabled: false,
      leadDays: 30,
    })
    expect(
      (await fetchPreferences()).find((pref) => pref.kind === 'STAY_EXPIRY'),
    ).toEqual({ kind: 'STAY_EXPIRY', enabled: false, leadDays: 30 })
  })

  it('marks one read, lowers the count and rejects unknown ids', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const before = (await fetchUnreadCount()).unreadCount
    const target = (await fetchNotifications(0)).content.find(
      (item) => !item.read,
    )!
    const updated = await markNotificationRead(target.notificationId)
    expect(updated).toMatchObject({
      notificationId: target.notificationId,
      read: true,
    })
    expect(updated.readAt).not.toBeNull()
    expect((await fetchUnreadCount()).unreadCount).toBe(before - 1)
    // Marking again keeps it read and the count unchanged.
    await markNotificationRead(target.notificationId)
    expect((await fetchUnreadCount()).unreadCount).toBe(before - 1)
    await expect(markNotificationRead(9999)).rejects.toMatchObject({
      status: 404,
      code: 'NOTIFICATION_NOT_FOUND',
    })
  })
})

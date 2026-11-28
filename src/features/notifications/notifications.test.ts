import { describe, expect, it } from 'vitest'
import {
  emailState,
  emailUpdates,
  groupState,
  groupUpdates,
  leadDaysUpdates,
  pickedLeadDays,
  notificationDay,
  notificationGroup,
  notificationPath,
  unreadBadge,
} from './notifications'

describe('notification screen rules', () => {
  it.each([
    ['STAY_EXPIRY', 'deadline'],
    ['REGISTRATION', 'deadline'],
    ['RESIDENCE_REPORT', 'deadline'],
    ['TAX', 'deadline'],
    ['BILL_DUE', 'deadline'],
    // Preference kind only; the BE never sends it as a notification kind.
    ['CHECKLIST_DEADLINE', 'other'],
    ['EVENT', 'event'],
    ['NOTICE_CHANGED', 'notice'],
    ['SOMETHING_NEW', 'other'],
  ])('groups %s as %s', (kind, group) => {
    expect(notificationGroup(kind)).toBe(group)
  })

  it('says today and yesterday in Korea time, else the date', () => {
    // 2026-11-26 10:00 in Korea
    const now = new Date('2026-11-26T01:00:00Z')
    expect(notificationDay('2026-11-26T00:30:00+09:00', 'ko', now)).toEqual({
      relative: 'today',
    })
    // 23:30 UTC on the 25th is already the 26th in Korea
    expect(notificationDay('2026-11-25T23:30:00Z', 'ko', now)).toEqual({
      relative: 'today',
    })
    expect(notificationDay('2026-11-25T09:00:00+09:00', 'ko', now)).toEqual({
      relative: 'yesterday',
    })
    expect(notificationDay('2026-11-03T09:00:00+09:00', 'ko', now)).toEqual({
      date: '11. 3.',
    })
  })

  const prefs = [
    { kind: 'STAY_EXPIRY', enabled: true, leadDays: 30 },
    { kind: 'CHECKLIST_DEADLINE', enabled: true, leadDays: 7 },
    { kind: 'TAX', enabled: false, leadDays: 7 },
    { kind: 'EVENT', enabled: true, leadDays: 1 },
    { kind: 'NOTICE_CHANGED', enabled: true, leadDays: 0 },
  ]

  it('shows a settings group as on, off or partial', () => {
    expect(groupState(prefs, 'deadline')).toBe('partial')
    expect(groupState(prefs, 'notice')).toBe('on')
    expect(
      groupState(
        prefs.map((pref) => ({ ...pref, enabled: false })),
        'deadline',
      ),
    ).toBe('off')
    expect(groupState([], 'notice')).toBe('off')
  })

  it('switches every kind in a group and keeps each leadDays', () => {
    expect(groupUpdates(prefs, 'deadline', true)).toEqual([
      { kind: 'STAY_EXPIRY', enabled: true, leadDays: 30 },
      { kind: 'CHECKLIST_DEADLINE', enabled: true, leadDays: 7 },
      { kind: 'TAX', enabled: true, leadDays: 7 },
    ])
    expect(groupUpdates(prefs, 'notice', false)).toEqual([
      { kind: 'NOTICE_CHANGED', enabled: false, leadDays: 0 },
    ])
  })

  it.each([
    ['EVENT', '12', '/events/12'],
    ['EVENT', 'abc', undefined],
    ['EVENT', null, undefined],
    ['CHECKLIST', 'CL-01', '/home/checklist/CL-01'],
    ['CHECKLIST', 'invalid', '/home'],
    ['CHECKLIST', null, '/home'],
    ['LIFE_CHANGE_TASK', 'LC-01-1', '/home/checklist/LC-01-1'],
    ['LIFE_CHANGE_TASK', 'LC-03-12', '/home/checklist/LC-03-12'],
    ['LIFE_CHANGE_TASK', 'LC-99-1', '/home'],
    ['LIFE_CHANGE_TASK', null, '/home'],
    ['RULE', 'waste-food', '/rules/waste-food'],
    ['RULE', 'RUL-03', '/rules'],
    ['RULE', null, '/rules'],
    ['BILL_TRANSLATION', '12', '/translations/bills/12'],
    ['BILL_TRANSLATION', null, '/translations/bills'],
    ['BILL_TRANSLATION', 'abc', '/translations/bills'],
    ['SCHEDULE', '5', '/calendar'],
    ['CALENDAR', null, '/calendar'],
    ['SOMETHING_NEW', 'x', undefined],
    [null, null, undefined],
  ])('opens %s %s at %s', (linkType, linkCode, path) => {
    expect(notificationPath({ linkType, linkCode })).toBe(path)
  })

  it('shows no badge at 0 and caps it at 99+', () => {
    expect(unreadBadge(undefined)).toBeUndefined()
    expect(unreadBadge(0)).toBeUndefined()
    expect(unreadBadge(2)).toBe('2')
    expect(unreadBadge(120)).toBe('99+')
  })

  describe('email and D-n reminders', () => {
    const full = [
      {
        kind: 'STAY_EXPIRY',
        enabled: true,
        leadDays: 30,
        emailEnabled: true,
        leadDaysList: [120, 60, 30, 14, 7, 1],
      },
      {
        kind: 'CHECKLIST_DEADLINE',
        enabled: true,
        leadDays: 7,
        emailEnabled: true,
        leadDaysList: [7, 1],
      },
      {
        kind: 'TAX',
        enabled: true,
        leadDays: 7,
        emailEnabled: false,
        leadDaysList: [7],
      },
      {
        kind: 'EVENT',
        enabled: true,
        leadDays: 1,
        emailEnabled: true,
        leadDaysList: [],
      },
      {
        kind: 'NOTICE_CHANGED',
        enabled: true,
        leadDays: 0,
        emailEnabled: true,
        leadDaysList: [],
      },
    ]

    it('shows email on, off or partial across every kind', () => {
      expect(emailState(full)).toBe('partial')
      expect(
        emailState(full.map((pref) => ({ ...pref, emailEnabled: true }))),
      ).toBe('on')
      expect(emailUpdates(full, false)).toHaveLength(5)
      expect(emailUpdates(full, false)[2]).toEqual({
        kind: 'TAX',
        enabled: true,
        leadDays: 7,
        emailEnabled: false,
      })
    })

    it('picks a day only when every 생활 마감 kind sends it', () => {
      expect(pickedLeadDays(full)).toEqual([7])
      expect(pickedLeadDays([])).toEqual([])
    })

    it('keeps the earlier stay expiry reminders and sets D-7·D-1', () => {
      expect(
        leadDaysUpdates(full, [1]).map(({ kind, leadDaysList }) => [
          kind,
          leadDaysList,
        ]),
      ).toEqual([
        ['STAY_EXPIRY', [120, 60, 30, 14, 1]],
        ['CHECKLIST_DEADLINE', [1]],
        ['TAX', [1]],
      ])
      expect(leadDaysUpdates(full, [7, 1])[2]).toEqual({
        kind: 'TAX',
        enabled: true,
        leadDays: 7,
        leadDaysList: [7, 1],
      })
    })
  })
})

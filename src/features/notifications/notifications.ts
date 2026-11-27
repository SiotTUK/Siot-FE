import { isEventId } from '@/features/events/event-routes'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { formatMonthDay, koreaToday } from '@/shared/i18n/format'

/**
 * Screen for a notification's link (NTF-04). Only screens that exist are
 * used: life change tasks open their life change page (home when the code is
 * unknown), checklist items open the home checklist, taxes and personal dates
 * open the calendar, rules open the rules list (BE RUL-xx codes are not FE
 * rule pages). Unknown links return undefined and the card only marks read.
 */
export function notificationPath(link: {
  linkType: string | null
  linkCode: string | null
}) {
  switch (link.linkType) {
    case 'EVENT':
      return isEventId(link.linkCode) ? `/events/${link.linkCode}` : undefined
    case 'LIFE_CHANGE_TASK': {
      // Task code LC-01-1 → its life change LC-01, whose page lists the tasks.
      const parent = link.linkCode?.split('-').slice(0, 2).join('-')
      return isLifeChangeCode(parent) ? `/home/life-changes/${parent}` : '/home'
    }
    case 'CHECKLIST':
      return '/home'
    case 'RULE':
      return '/rules'
    case 'SCHEDULE':
    case 'CALENDAR':
      return '/calendar'
    default:
      return undefined
  }
}

/** Figma M09 badge groups: 생활 마감 · 행사 · 안내 변경, the rest as 알림. */
export type NotificationGroup = 'deadline' | 'event' | 'notice' | 'other'

export function notificationGroup(kind: string): NotificationGroup {
  if (['STAY_EXPIRY', 'CHECKLIST_DEADLINE', 'TAX'].includes(kind))
    return 'deadline'
  if (kind === 'EVENT') return 'event'
  if (kind === 'NOTICE_CHANGED') return 'notice'
  return 'other'
}

const dayMs = 24 * 60 * 60 * 1000

/**
 * "오늘" / "어제" / "11. 3." in Korea time, as the M09 badge shows it.
 * Returns the relative word key or a formatted date.
 */
export function notificationDay(
  createdAt: string,
  language: string,
  now = new Date(),
): { relative: 'today' | 'yesterday' } | { date: string } {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return { date: '' }
  const day = koreaToday(created)
  if (day === koreaToday(now)) return { relative: 'today' }
  if (day === koreaToday(new Date(now.getTime() - dayMs)))
    return { relative: 'yesterday' }
  return { date: formatMonthDay(day, language) }
}

/**
 * Figma M09 settings: one checkbox can stand for several BE kinds.
 * "생활 마감 (세금·체류 연장)" covers stay expiry, checklist deadlines and taxes.
 */
export const preferenceGroups = {
  deadline: ['STAY_EXPIRY', 'CHECKLIST_DEADLINE', 'TAX'],
  notice: ['NOTICE_CHANGED'],
} as const
export type PreferenceGroup = keyof typeof preferenceGroups

type Preference = { kind: string; enabled: boolean; leadDays: number }

/**
 * A group's switch state: on when every kind is on, off when none is, and
 * partial when only some are (e.g. after a save that half failed).
 */
export function groupState(
  prefs: Preference[],
  group: PreferenceGroup,
): 'on' | 'off' | 'partial' {
  const kinds: readonly string[] = preferenceGroups[group]
  const inGroup = prefs.filter((pref) => kinds.includes(pref.kind))
  const on = inGroup.filter((pref) => pref.enabled).length
  if (on === 0) return 'off'
  return on === inGroup.length ? 'on' : 'partial'
}

/** The PUT bodies for switching a group, keeping each kind's leadDays. */
export function groupUpdates(
  prefs: Preference[],
  group: PreferenceGroup,
  enabled: boolean,
): Preference[] {
  const kinds: readonly string[] = preferenceGroups[group]
  return prefs
    .filter((pref) => kinds.includes(pref.kind))
    .map((pref) => ({ kind: pref.kind, enabled, leadDays: pref.leadDays }))
}

/** Badge number in the top bar: nothing at 0, "99+" past 99. */
export function unreadBadge(count: number | undefined) {
  if (!count || count < 1) return undefined
  return count > 99 ? '99+' : String(count)
}

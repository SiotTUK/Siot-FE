import { billTranslationPath } from '@/features/bill-translation/bill-translation'
import { isChecklistCode } from '@/features/checklist/checklist'
import { isEventId } from '@/features/events/event-routes'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { isRuleCode } from '@/features/rules/rules'
import { formatMonthDay, koreaToday } from '@/shared/i18n/format'

/**
 * Screen for a notification's link (NTF-04). Only screens that exist are
 * used: checklist items and life change tasks open their checklist detail
 * (/home/checklist/:code), taxes and personal dates open the calendar,
 * rules open their detail page when the slug is recognized (/rules when
 * unknown). A bill reminder opens its translation result; without an id (the
 * translation was deleted) it opens the screen with the recent list.
 * Unknown codes fall back to their main home/rules list.
 * Unknown link types return undefined and the card only marks read.
 */
export function notificationPath(link: {
  linkType: string | null
  linkCode: string | null
}) {
  switch (link.linkType) {
    case 'EVENT':
      return isEventId(link.linkCode) ? `/events/${link.linkCode}` : undefined
    case 'LIFE_CHANGE_TASK': {
      const parent = link.linkCode?.split('-').slice(0, 2).join('-')
      return isLifeChangeCode(parent) && link.linkCode?.includes('-')
        ? `/home/checklist/${link.linkCode}`
        : '/home'
    }
    case 'CHECKLIST':
      return isChecklistCode(link.linkCode)
        ? `/home/checklist/${link.linkCode}`
        : '/home'
    case 'RULE':
      return isRuleCode(link.linkCode) ? `/rules/${link.linkCode}` : '/rules'
    case 'BILL_TRANSLATION':
      return /^[1-9]\d*$/.test(link.linkCode ?? '')
        ? `${billTranslationPath}/${link.linkCode}`
        : billTranslationPath
    case 'SCHEDULE':
    case 'CALENDAR':
      return '/calendar'
    default:
      return undefined
  }
}

/** Figma M09 badge groups: 생활 마감 · 행사 · 안내 변경, the rest as 알림. */
export type NotificationGroup = 'deadline' | 'event' | 'notice' | 'other'

/**
 * Notification kinds the BE saves for deadlines. CHECKLIST_DEADLINE is only a
 * preference kind (it turns REGISTRATION·RESIDENCE_REPORT on or off), so it
 * never arrives as a notification kind (FE #52).
 */
const deadlineKinds: readonly string[] = [
  'STAY_EXPIRY',
  'REGISTRATION',
  'RESIDENCE_REPORT',
  'TAX',
  'BILL_DUE',
]

export function notificationGroup(kind: string): NotificationGroup {
  if (deadlineKinds.includes(kind)) return 'deadline'
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

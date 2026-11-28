import { billTranslationPath } from '@/features/bill-translation/bill-translation'
import { isChecklistCode } from '@/features/checklist/checklist'
import { isEventId } from '@/features/events/event-routes'
import { isLifeChangeCode } from '@/features/life-changes/life-changes'
import { isRuleCode } from '@/features/rules/rules'
import { formatMonthDay, koreaToday } from '@/shared/i18n/format'

/**
 * Screen for a notification's link (NTF-04): checklist items and life
 * change tasks open their checklist detail (/home/checklist/:code), a tax
 * reminder (SCHEDULE, its common tax schedule id) opens the tax detail
 * (CAL-03 /calendar/taxes/:id, the calendar when the id is not a number),
 * personal dates open the calendar, rules open their detail page when the
 * slug is recognized (/rules when unknown). A bill reminder opens its
 * translation result; without an id (the translation was deleted) it opens
 * the screen with the recent list. Unknown codes fall back to their main
 * home/rules list. Unknown link types return undefined and the card only
 * marks read.
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
      return /^[1-9]\d*$/.test(link.linkCode ?? '')
        ? `/calendar/taxes/${link.linkCode}`
        : '/calendar'
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

type Preference = {
  kind: string
  enabled: boolean
  leadDays: number
  emailEnabled?: boolean
  leadDaysList?: number[]
}

/** One PUT body: what is left out keeps its saved value. */
export type PreferenceUpdate = {
  kind: string
  enabled: boolean
  leadDays: number
  emailEnabled?: boolean
  leadDaysList?: number[]
}

function onOff(on: number, total: number): 'on' | 'off' | 'partial' {
  if (on === 0) return 'off'
  return on === total ? 'on' : 'partial'
}

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
  return onOff(inGroup.filter((pref) => pref.enabled).length, inGroup.length)
}

/** The PUT bodies for switching a group, keeping each kind's leadDays. */
export function groupUpdates(
  prefs: Preference[],
  group: PreferenceGroup,
  enabled: boolean,
): PreferenceUpdate[] {
  const kinds: readonly string[] = preferenceGroups[group]
  return prefs
    .filter((pref) => kinds.includes(pref.kind))
    .map((pref) => ({ kind: pref.kind, enabled, leadDays: pref.leadDays }))
}

/**
 * M09 "이메일로도 받기 (가입 이메일)" (NTF-05). One checkbox for every kind,
 * events included; the BE sends email only for kinds that are on.
 */
export function emailState(prefs: Preference[]) {
  return onOff(prefs.filter((pref) => pref.emailEnabled).length, prefs.length)
}

export function emailUpdates(
  prefs: Preference[],
  emailEnabled: boolean,
): PreferenceUpdate[] {
  return prefs.map((pref) => ({
    kind: pref.kind,
    enabled: pref.enabled,
    leadDays: pref.leadDays,
    emailEnabled,
  }))
}

/** M09 "기한 알림 시점 D-7 · D-1". */
export const deadlineLeadDays = [7, 1] as const
export type DeadlineLeadDay = (typeof deadlineLeadDays)[number]

/** A day is picked when every 생활 마감 kind sends it. */
export function pickedLeadDays(prefs: Preference[]): DeadlineLeadDay[] {
  const kinds: readonly string[] = preferenceGroups.deadline
  const inGroup = prefs.filter((pref) => kinds.includes(pref.kind))
  if (!inGroup.length) return []
  return deadlineLeadDays.filter((day) =>
    inGroup.every((pref) => pref.leadDaysList?.includes(day)),
  )
}

/**
 * PUT bodies for the picked D-7·D-1 (at least one). Checklist deadlines and
 * taxes get exactly the picked days; stay expiry keeps its earlier reminders
 * (120·60·30·14) and only D-7·D-1 follow the pick.
 */
export function leadDaysUpdates(
  prefs: Preference[],
  picked: readonly DeadlineLeadDay[],
): PreferenceUpdate[] {
  const kinds: readonly string[] = preferenceGroups.deadline
  const pickedDays: readonly number[] = picked
  const fixed: readonly number[] = deadlineLeadDays
  return prefs
    .filter((pref) => kinds.includes(pref.kind))
    .map((pref) => {
      const kept = (pref.leadDaysList ?? []).filter(
        (day) => !fixed.includes(day),
      )
      const leadDaysList = [...new Set([...kept, ...pickedDays])].sort(
        (a, b) => b - a,
      )
      return {
        kind: pref.kind,
        enabled: pref.enabled,
        leadDays: pref.leadDays,
        leadDaysList,
      }
    })
}

/** Badge number in the top bar: nothing at 0, "99+" past 99. */
export function unreadBadge(count: number | undefined) {
  if (!count || count < 1) return undefined
  return count > 99 ? '99+' : String(count)
}

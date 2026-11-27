import type { TFunction } from 'i18next'
import { chatBackPath } from '@/shared/lib/chat-back'
import { ApiError } from '@/shared/api/client'
import { errorMessage } from '@/shared/i18n/error-message'
import type { ChecklistItemResponse, ChecklistMark } from './api'

/** Home-screen threshold from the checklist rules ("30일 규칙"). */
export const urgentDays = 30

const open = (item: ChecklistItemResponse) =>
  item.status === 'TODO' || item.status === 'OVERDUE'

const notApplicableLast = (items: ChecklistItemResponse[]) => [
  ...items.filter((item) => item.status !== 'NOT_APPLICABLE'),
  ...items.filter((item) => item.status === 'NOT_APPLICABLE'),
]

/**
 * Splits items the way H1/H2 shows them. Server order is kept, except that
 * items marked "해당 없음" sink to the bottom of their group.
 */
export function groupItems(items: ChecklistItemResponse[]) {
  return {
    main: notApplicableLast(
      items.filter((item) => item.itemType !== 'OPTIONAL'),
    ),
    optional: notApplicableLast(
      items.filter((item) => item.itemType === 'OPTIONAL'),
    ),
  }
}

/**
 * CHK-08 warning (#50): the server's `warning` on an item still to do. The BE
 * keeps REGISTRATION_DUE on a completed CL-01·CL-02, so done and "해당 없음"
 * items never warn.
 */
export const hasWarning = (item: ChecklistItemResponse) =>
  item.warning === true && open(item)

/** Server warning text in the requested language, if the item warns. */
export const warningText = (item: ChecklistItemResponse) =>
  (hasWarning(item) && item.warningMessage) || undefined

/**
 * "마감 임박" chip on a task row: a warning other than an overdue one, which
 * the red "기한 지남" chip already shows.
 */
export const dueSoon = (item: ChecklistItemResponse) =>
  hasWarning(item) && item.status !== 'OVERDUE'

const byDeadline = (a: ChecklistItemResponse, b: ChecklistItemResponse) =>
  (a.dDay ?? 0) - (b.dDay ?? 0)

/**
 * The alert banner (#50): the item the server warns about (CHK-08) with the
 * nearest deadline. Without one, the open item with the nearest deadline
 * within 30 days (or past). The FE never computes deadlines itself.
 */
export function pickDeadlineAlert(items: ChecklistItemResponse[]) {
  const dated = items.filter((item) => open(item) && item.dDay !== null)
  return (
    dated.filter(hasWarning).sort(byDeadline)[0] ??
    dated.filter((item) => (item.dDay ?? 0) <= urgentDays).sort(byDeadline)[0]
  )
}

/**
 * Home hero (Figma v2 H1/H2). `urgent`: what `pickDeadlineAlert` picks.
 * Otherwise `calm` ("지금 급한 할 일은
 * 없어요") with the next open item that has a later deadline, if any.
 */
export function homeHero(
  items: ChecklistItemResponse[],
):
  | { kind: 'urgent'; item: ChecklistItemResponse }
  | { kind: 'calm'; next?: ChecklistItemResponse } {
  const urgent = pickDeadlineAlert(items)
  if (urgent) return { kind: 'urgent', item: urgent }
  return { kind: 'calm', next: pickNextItem(items) }
}

/** Required items still to do (the "나에게 필요한 할 일 N" count). */
export function openRequiredCount(items: ChecklistItemResponse[]) {
  return items.filter((item) => item.itemType === 'REQUIRED' && open(item))
    .length
}

/**
 * H2 "다음 할 일": the open item whose server deadline comes first. The home
 * switches to H2 when `pickDeadlineAlert` finds nothing within 30 days.
 */
export function pickNextItem(items: ChecklistItemResponse[]) {
  return items
    .filter((item) => open(item) && item.dDay !== null && item.deadline)
    .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))[0]
}

/**
 * Life change a task belongs to (LC-01-1 → LC-01), for the chip in front of
 * its title (Figma v2 H1 "이사").
 */
export function lifeChangeOf(item: ChecklistItemResponse) {
  if (item.kind !== 'LIFE_CHANGE_TASK') return undefined
  return /^(LC-\d{2})-/.exec(item.code)?.[1]
}

/**
 * Why a life-change task shows up (Figma v2 F06b "자차가 있어서 보여요"),
 * from the server category: CAR tasks need a car, EDUCATION tasks a child at
 * school (BE seed: LC-01-3 CAR, LC-01-4 EDUCATION). Skipped on the car and
 * school life changes themselves, where every task has that reason.
 */
export function reasonOf(item: ChecklistItemResponse) {
  const lifeChange = lifeChangeOf(item)
  if (!lifeChange) return undefined
  if (item.category === 'CAR' && lifeChange !== 'LC-04') return 'CAR'
  if (item.category === 'EDUCATION' && lifeChange !== 'LC-03') return 'KIDS'
  return undefined
}

/**
 * "번역 준비 중" (BE #30): only the server's `translated` flag decides, never
 * a guess from the text. A missing flag (older BE) shows nothing.
 */
export const translationPending = (item: ChecklistItemResponse) =>
  item.translated === false

/** What the checkbox and "해당 없음" buttons send for an item. */
export function nextMark(
  item: ChecklistItemResponse,
  action: 'toggleDone' | 'toggleNotApplicable',
): ChecklistMark {
  if (action === 'toggleDone') return item.status === 'DONE' ? null : 'DONE'
  return item.status === 'NOT_APPLICABLE' ? null : 'NOT_APPLICABLE'
}

/** Status to show right away while the change is being saved. */
export function optimisticStatus(
  item: ChecklistItemResponse,
  mark: ChecklistMark,
): ChecklistItemResponse['status'] {
  if (mark) return mark
  return item.dDay !== null && item.dDay < 0 ? 'OVERDUE' : 'TODO'
}

export const checklistItemKey = (item: ChecklistItemResponse) =>
  `${item.code}:${item.periodKey}`

/** CL-xx checklist item code format. */
export function isChecklistCode(value: unknown): value is string {
  return typeof value === 'string' && /^CL-\d+$/.test(value)
}

export function deadlineText(
  item: ChecklistItemResponse,
  pastDeadline: string,
) {
  return item.dDay !== null && item.dDay < 0 ? pastDeadline : item.dDayText
}

/**
 * Fresh server data in the order the member is looking at. The server moves
 * completed items to the end; doing that right after a tap makes the cards
 * jump, so the visible order is kept until the next visit. New items go last.
 */
export function keepOrder(fresh: ChecklistItemResponse[], shownKeys: string[]) {
  const position = new Map(shownKeys.map((key, index) => [key, index]))
  const rank = (item: ChecklistItemResponse) =>
    position.get(checklistItemKey(item)) ?? Number.MAX_SAFE_INTEGER
  return [...fresh].sort((a, b) => rank(a) - rank(b))
}

/**
 * Error text for a failed check. GUIDE_NOT_FOUND means an admin deleted the
 * item after the list loaded; the mutation refetches the list afterwards.
 */
export function markErrorMessage(t: TFunction, error: unknown) {
  return error instanceof ApiError && error.code === 'GUIDE_NOT_FOUND'
    ? t('checklist.itemGone')
    : errorMessage(t, error)
}

/**
 * Where "‹" on the checklist detail goes: the screen that opened it (F06b
 * passes its path as link state), otherwise home — also for notifications
 * and shared links, which carry no state.
 */
export function detailBackPath(state: unknown): string {
  const back = (state as { back?: unknown } | null)?.back
  if (typeof back === 'string' && back.startsWith('/home/')) return back
  // Opened from a chat related page (CB-10).
  return chatBackPath(state) ?? '/home'
}

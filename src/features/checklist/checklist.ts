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
 * The alert banner: the open item with the nearest server-computed deadline,
 * if it is within 30 days (or past). The FE never computes deadlines itself.
 */
export function pickDeadlineAlert(items: ChecklistItemResponse[]) {
  return items
    .filter(
      (item) => open(item) && item.dDay !== null && item.dDay <= urgentDays,
    )
    .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))[0]
}

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

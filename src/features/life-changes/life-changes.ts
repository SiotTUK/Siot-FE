import type { ChecklistItemResponse } from '@/features/checklist/api'

export const lifeChangeCodes = [
  'LC-01',
  'LC-02',
  'LC-03',
  'LC-04',
  'LC-05',
  'LC-06',
  'LC-07',
  'LC-08',
] as const

export type LifeChangeCode = (typeof lifeChangeCodes)[number]

export function isLifeChangeCode(value: unknown): value is LifeChangeCode {
  return lifeChangeCodes.some((code) => code === value)
}

export function relatedLifeChangeTasks(
  items: ChecklistItemResponse[],
  code: LifeChangeCode,
  baseDate: string,
) {
  return items.filter(
    (item) =>
      item.kind === 'LIFE_CHANGE_TASK' &&
      item.code.startsWith(`${code}-`) &&
      item.periodKey === baseDate,
  )
}

/**
 * Home "생활 변화" card: the most recently dated change and how many of its
 * tasks are still open ("이사 진행 중 · 할 일 3개").
 */
export function currentLifeChange(
  changes: { lifeChangeCode: LifeChangeCode; baseDate: string }[],
  items: ChecklistItemResponse[],
) {
  const latest = [...changes].sort((a, b) =>
    b.baseDate.localeCompare(a.baseDate),
  )[0]
  if (!latest) return undefined
  const openTasks = relatedLifeChangeTasks(
    items,
    latest.lifeChangeCode,
    latest.baseDate,
  ).filter((item) => item.status === 'TODO' || item.status === 'OVERDUE')
  return {
    code: latest.lifeChangeCode,
    baseDate: latest.baseDate,
    openCount: openTasks.length,
  }
}

/**
 * F06b: the open task with the nearest deadline goes on the "먼저 하세요"
 * card; every other task (done ones too) is listed under "함께 챙길 일".
 */
export function splitLifeChangeTasks(tasks: ChecklistItemResponse[]) {
  const first = tasks
    .filter(
      (item) =>
        (item.status === 'TODO' || item.status === 'OVERDUE') &&
        item.dDay !== null,
    )
    .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))[0]
  return { first, others: tasks.filter((item) => item !== first) }
}

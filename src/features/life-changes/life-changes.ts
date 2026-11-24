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

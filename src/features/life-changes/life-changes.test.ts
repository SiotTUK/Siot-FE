import { describe, expect, it } from 'vitest'
import type { ChecklistItemResponse } from '@/features/checklist/api'
import { currentLifeChange, splitLifeChangeTasks } from './life-changes'

const item = (over: Partial<ChecklistItemResponse>) =>
  ({
    code: 'CL-01',
    kind: 'CHECKLIST',
    itemType: 'REQUIRED',
    status: 'TODO',
    periodKey: '',
    dDay: null,
    ...over,
  }) as ChecklistItemResponse

const task = (code: string, periodKey: string, status = 'TODO' as const) =>
  item({ code, kind: 'LIFE_CHANGE_TASK', periodKey, status })

describe('home life-change helpers', () => {
  it('shows the latest change with its open tasks for that date', () => {
    const items = [
      task('LC-01-1', '2026-11-01'),
      task('LC-01-3', '2026-11-01'),
      item({ ...task('LC-01-4', '2026-11-01'), status: 'DONE' }),
      task('LC-01-1', '2026-06-01'),
      task('LC-02-2', '2026-10-01'),
    ]
    expect(
      currentLifeChange(
        [
          { lifeChangeCode: 'LC-02', baseDate: '2026-10-01' },
          { lifeChangeCode: 'LC-01', baseDate: '2026-11-01' },
        ],
        items,
      ),
    ).toEqual({ code: 'LC-01', baseDate: '2026-11-01', openCount: 2 })
    expect(currentLifeChange([], items)).toBeUndefined()
  })

  it('puts the open task with the nearest deadline first', () => {
    const report = item({ ...task('LC-01-1', 'd'), dDay: 8 })
    const car = item({ ...task('LC-01-3', 'd'), dDay: 23 })
    const done = item({ ...task('LC-01-2', 'd'), dDay: 2, status: 'DONE' })
    const school = task('LC-01-4', 'd')
    const { first, others } = splitLifeChangeTasks([school, car, done, report])
    expect(first).toBe(report)
    expect(others).toEqual([school, car, done])
    expect(splitLifeChangeTasks([school]).first).toBeUndefined()
  })
})

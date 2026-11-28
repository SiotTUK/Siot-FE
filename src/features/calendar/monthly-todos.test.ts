import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { formatYearMonth } from '@/shared/i18n/format'
import {
  fetchMonthlyTodos,
  monthlyTodosQueryKey,
  type ScheduleResponse,
} from './api'
import {
  buildMonthlyTodos,
  defaultHomeView,
  nextCalendarMonth,
  todoMonthIso,
} from './monthly-todos'
import { scheduleDetailLink } from './taxes'

const baseSchedule: ScheduleResponse = {
  scheduleId: 1,
  guideId: 101,
  kind: 'TAX',
  title: '주민세 (개인분)',
  startsOn: '2026-11-05',
  endsOn: '2026-11-10',
  targetDescription: null,
  sourceUrl: null,
  personal: false,
  highlighted: false,
  taxScheduleId: 1,
}

describe('defaultHomeView', () => {
  it('opens checklist for NEW (or unset) and monthly to-dos for LIVING', () => {
    expect(defaultHomeView('NEW')).toBe('checklist')
    expect(defaultHomeView('LIVING')).toBe('monthly')
    expect(defaultHomeView(null)).toBe('checklist')
    expect(defaultHomeView(undefined)).toBe('checklist')
  })
})

describe('monthlyTodosQueryKey', () => {
  it('includes both member id and language', () => {
    expect(monthlyTodosQueryKey(7, 'ko')).toEqual([
      'schedules',
      7,
      'this-month',
      'ko',
    ])
    expect(monthlyTodosQueryKey(7, 'en')).not.toEqual(
      monthlyTodosQueryKey(7, 'ko'),
    )
    expect(monthlyTodosQueryKey(8, 'ko')).not.toEqual(
      monthlyTodosQueryKey(7, 'ko'),
    )
  })
})

describe('buildMonthlyTodos', () => {
  it('includes due-today (D-0) items, drops past ones, and sorts by nearest dDay', () => {
    const past: ScheduleResponse = {
      ...baseSchedule,
      scheduleId: 1,
      title: '지난 일정',
      startsOn: '2026-11-01',
      endsOn: '2026-11-09',
    }
    const dueToday: ScheduleResponse = {
      ...baseSchedule,
      scheduleId: 2,
      title: '오늘 마감',
      startsOn: '2026-11-05',
      endsOn: '2026-11-10',
    }
    const laterOneDay: ScheduleResponse = {
      ...baseSchedule,
      scheduleId: 3,
      title: '단일 일정',
      startsOn: '2026-11-15',
      endsOn: null,
    }

    const result = buildMonthlyTodos(
      () => [laterOneDay, past, dueToday],
      '2026-11-10',
    )

    expect(result.year).toBe(2026)
    expect(result.month).toBe(11)
    expect(result.nextMonth).toBe(false)
    expect(
      result.items.map(({ schedule, dDay }) => ({
        title: schedule.title,
        dDay,
      })),
    ).toEqual([
      { title: '오늘 마감', dDay: 0 },
      { title: '단일 일정', dDay: 5 },
    ])
  })

  it('falls back to the next month when this month has no remaining schedules', () => {
    const result = buildMonthlyTodos((year, month) => {
      if (year === 2026 && month === 11) {
        return [
          { ...baseSchedule, startsOn: '2026-11-05', endsOn: '2026-11-10' },
        ]
      }
      if (year === 2026 && month === 12) {
        return [
          {
            ...baseSchedule,
            scheduleId: 2,
            title: '자동차세 (2기분)',
            startsOn: '2026-12-16',
            endsOn: '2026-12-31',
          },
        ]
      }
      return []
    }, '2026-11-28')

    expect(result).toMatchObject({
      year: 2026,
      month: 12,
      nextMonth: true,
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].dDay).toBe(33)
  })

  it('rolls over December into January of the next year when falling back', () => {
    expect(nextCalendarMonth(2026, 12)).toEqual({ year: 2027, month: 1 })

    const result = buildMonthlyTodos((year, month) => {
      if (year === 2026 && month === 12) {
        return [
          { ...baseSchedule, startsOn: '2026-12-05', endsOn: '2026-12-10' },
        ]
      }
      if (year === 2027 && month === 1) {
        return [
          {
            ...baseSchedule,
            scheduleId: 10,
            title: '자동차세 연납',
            startsOn: '2027-01-16',
            endsOn: '2027-01-31',
          },
        ]
      }
      return []
    }, '2026-12-25')

    expect(result).toMatchObject({
      year: 2027,
      month: 1,
      nextMonth: true,
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].schedule.title).toBe('자동차세 연납')
    expect(result.items[0].dDay).toBe(37)
    expect(formatYearMonth(todoMonthIso(result.year, result.month), 'ko')).toBe(
      '2027년 1월',
    )
    expect(formatYearMonth(todoMonthIso(result.year, result.month), 'en')).toBe(
      'January 2027',
    )
  })

  it('returns nextMonth=true with empty items when both months have no schedules', () => {
    const result = buildMonthlyTodos(() => [], '2026-12-20')

    expect(result).toEqual({
      year: 2027,
      month: 1,
      nextMonth: true,
      items: [],
    })
  })
})

describe('scheduleDetailLink', () => {
  it('links tax schedules to the tax detail and other common schedules to the schedule detail', () => {
    expect(scheduleDetailLink({ scheduleId: null, taxScheduleId: 5 })).toEqual({
      to: '/calendar/taxes/5',
      label: 'calendar.tax.open',
    })
    expect(scheduleDetailLink({ scheduleId: 3, taxScheduleId: null })).toEqual({
      to: '/calendar/schedules/3',
      label: 'calendar.schedule.open',
    })
    expect(
      scheduleDetailLink({ scheduleId: null, taxScheduleId: null }),
    ).toBeNull()
  })
})

describe('fetchMonthlyTodos (MSW contract)', () => {
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

  it('requires login', async () => {
    await expect(fetchMonthlyTodos('ko')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })

  it('requests GET /api/schedules/this-month with language parameter', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    const response = await fetchMonthlyTodos('vi')
    expect(typeof response.year).toBe('number')
    expect(response.month).toBeGreaterThanOrEqual(1)
    expect(response.month).toBeLessThanOrEqual(12)
    expect(typeof response.nextMonth).toBe('boolean')
    expect(response.items.length).toBeGreaterThan(0)
    expect(response.items[0].dDay).toBeGreaterThanOrEqual(0)
    expect(response.items[0].schedule.title).toContain('Thuế cư trú')
  })
})

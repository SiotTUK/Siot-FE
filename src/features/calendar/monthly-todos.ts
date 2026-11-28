import type { UserType } from '@/shared/api/types'
import type {
  MonthlyTodoItemResponse,
  MonthlyTodoResponse,
  ScheduleResponse,
} from './api'

export type HomeView = 'checklist' | 'monthly'

/**
 * CAL-02 · CHK-04 default home view: LIVING members open monthly to-dos first,
 * NEW (or unset) members open the settlement checklist first.
 */
export function defaultHomeView(
  userType: UserType | null | undefined,
): HomeView {
  return userType === 'LIVING' ? 'monthly' : 'checklist'
}

/** YYYY-MM-01 date string for formatting the response year and month. */
export function todoMonthIso(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/** Calendar month after (year, month), rolling December into January of year + 1. */
export function nextCalendarMonth(year: number, month: number) {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 }
}

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  )

function remainingTodoItems(
  schedules: ScheduleResponse[],
  today: string,
): MonthlyTodoItemResponse[] {
  return schedules
    .map((schedule) => ({
      schedule,
      dDay: daysBetween(today, schedule.endsOn ?? schedule.startsOn),
    }))
    .filter((item) => item.dDay >= 0)
    .sort((first, second) => first.dDay - second.dDay)
}

/**
 * Matches BE CalendarScheduleService.getMonthlyTodos: keeps schedules due today
 * (dDay === 0) or later sorted by nearest deadline, and falls back to the next
 * calendar month (rolling over December → next year January) when this month
 * has no remaining schedules.
 */
export function buildMonthlyTodos(
  schedulesForMonth: (year: number, month: number) => ScheduleResponse[],
  today: string,
): MonthlyTodoResponse {
  const [year, month] = today.split('-').map(Number)
  const currentItems = remainingTodoItems(schedulesForMonth(year, month), today)
  if (currentItems.length > 0) {
    return { year, month, nextMonth: false, items: currentItems }
  }
  const next = nextCalendarMonth(year, month)
  return {
    year: next.year,
    month: next.month,
    nextMonth: true,
    items: remainingTodoItems(schedulesForMonth(next.year, next.month), today),
  }
}

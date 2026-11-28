import type { ScheduleResponse, TaxDetailResponse } from './api'

/**
 * Which round of a tax to open from a rule: the first whose deadline has not
 * passed (server `dDay` ≥ 0), else the latest (last) one. The list comes in
 * start date order. Empty → none, and the screen hides the link.
 */
export function pickTaxRound(rounds: TaxDetailResponse[]) {
  return (
    rounds.find((round) => round.dDay !== null && round.dDay >= 0) ??
    rounds.at(-1)
  )
}

export const taxDetailPath = (scheduleId: number) =>
  `/calendar/taxes/${scheduleId}`

/** CAL-03 detail of a common schedule that is not a tax (#34). */
export const scheduleDetailPath = (scheduleId: number) =>
  `/calendar/schedules/${scheduleId}`

/**
 * Shared detail target for a schedule row (#34): personal TAX_CAR·TAX_PROPERTY
 * have no scheduleId, so taxScheduleId opens the tax detail first; other common
 * schedules open the schedule detail. Personal stay schedules have no detail.
 */
export function scheduleDetailLink(
  schedule: Pick<ScheduleResponse, 'scheduleId' | 'taxScheduleId'>,
) {
  if (schedule.taxScheduleId != null) {
    return {
      to: taxDetailPath(schedule.taxScheduleId),
      label: 'calendar.tax.open' as const,
    }
  }
  if (schedule.scheduleId != null) {
    return {
      to: scheduleDetailPath(schedule.scheduleId),
      label: 'calendar.schedule.open' as const,
    }
  }
  return null
}

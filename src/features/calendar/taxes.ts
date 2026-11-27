import type { TaxDetailResponse } from './api'

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

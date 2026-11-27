import type { TaxDetailResponse } from './api'

/**
 * Tax kind of a 생활 수칙 item. The BE rules API sends this as `taxKind`
 * (BE #29: tax-car → TAX_CAR, tax-property → TAX_PROPERTY, tax-resident →
 * TAX_RESIDENT). The FE still reads rules from its static content (#42), so
 * the same mapping lives here until the screen moves to the API.
 */
const ruleTaxKinds: Record<string, string> = {
  'tax-car': 'TAX_CAR',
  'tax-property': 'TAX_PROPERTY',
  'tax-resident': 'TAX_RESIDENT',
}

export function ruleTaxKind(ruleCode: string): string | undefined {
  return ruleTaxKinds[ruleCode]
}

/**
 * Which round of a tax to open from a rule: the first whose deadline has not
 * passed (server `dDay` ≥ 0), else the latest one. The list comes in start
 * date order. Empty → none, and the screen hides the link.
 */
export function pickTaxRound(rounds: TaxDetailResponse[]) {
  return (
    rounds.find((round) => round.dDay !== null && round.dDay >= 0) ??
    rounds.at(-1)
  )
}

export const taxDetailPath = (scheduleId: number) =>
  `/calendar/taxes/${scheduleId}`

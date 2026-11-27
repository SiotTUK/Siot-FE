import { describe, expect, it } from 'vitest'
import type { TaxDetailResponse } from './api'
import { pickTaxRound, taxDetailPath } from './taxes'

const round = (scheduleId: number, dDay: number | null): TaxDetailResponse => ({
  scheduleId,
  guideId: null,
  kind: 'TAX_CAR',
  title: '자동차세',
  startsOn: '2026-06-16',
  endsOn: '2026-06-30',
  targetDescription: null,
  sourceUrl: null,
  summary: null,
  content: null,
  place: null,
  docs: null,
  fee: null,
  law: null,
  penalty: null,
  contact: null,
  sourcePages: null,
  dDay,
})

describe('tax detail links', () => {
  it('opens the first round whose deadline has not passed', () => {
    expect(pickTaxRound([round(1, -150), round(2, 33)])?.scheduleId).toBe(2)
    expect(pickTaxRound([round(1, 0), round(2, 180)])?.scheduleId).toBe(1)
  })

  it('falls back to the latest round, and none for an empty list', () => {
    expect(pickTaxRound([round(1, -200), round(2, -20)])?.scheduleId).toBe(2)
    expect(pickTaxRound([])).toBeUndefined()
  })

  it('builds the detail path from the schedule id', () => {
    expect(taxDetailPath(10)).toBe('/calendar/taxes/10')
  })
})

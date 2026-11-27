import { describe, expect, it } from 'vitest'
import {
  eventListQuery,
  hasEventFilters,
  isDateRangeValid,
  isIsoDate,
  parseEventFilters,
  withEventFilters,
} from './event-filters'

describe('isIsoDate', () => {
  it.each(['2026-11-27', '2028-02-29'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })

  it.each([null, '', '2026-11-31', '2027-02-29', '2026-1-05', '20261127'])(
    'rejects %s',
    (value) => {
      expect(isIsoDate(value)).toBe(false)
    },
  )
})

describe('parseEventFilters', () => {
  it('reads past and the date range from the URL', () => {
    expect(
      parseEventFilters(
        new URLSearchParams('past=true&from=2026-12-01&to=2026-12-31'),
      ),
    ).toEqual({ past: true, from: '2026-12-01', to: '2026-12-31' })
  })

  it('drops malformed values', () => {
    expect(
      parseEventFilters(new URLSearchParams('past=1&from=tomorrow&to=')),
    ).toEqual({ past: false, from: null, to: null })
  })
})

describe('isDateRangeValid', () => {
  it.each([
    [null, null],
    ['2026-12-01', null],
    [null, '2026-12-01'],
    ['2026-12-01', '2026-12-01'],
    ['2026-12-01', '2026-12-31'],
  ])('allows from %s to %s', (from, to) => {
    expect(isDateRangeValid({ past: false, from, to })).toBe(true)
  })

  it('rejects from later than to', () => {
    expect(
      isDateRangeValid({ past: false, from: '2026-12-31', to: '2026-12-01' }),
    ).toBe(false)
  })
})

it('reports whether any filter is set', () => {
  expect(hasEventFilters({ past: false, from: null, to: null })).toBe(false)
  expect(hasEventFilters({ past: true, from: null, to: null })).toBe(true)
  expect(hasEventFilters({ past: false, from: null, to: '2026-12-01' })).toBe(
    true,
  )
})

describe('withEventFilters', () => {
  it('sets the filters, keeps other params and resets the page', () => {
    const next = withEventFilters(
      new URLSearchParams('page=3&region=SIHEUNG&to=2026-12-01'),
      { past: true, from: '2026-11-01', to: null },
    )
    expect(Object.fromEntries(next)).toEqual({
      region: 'SIHEUNG',
      past: 'true',
      from: '2026-11-01',
    })
  })
})

describe('eventListQuery', () => {
  it('sends only the page by default', () => {
    expect(eventListQuery(0, { past: false, from: null, to: null })).toBe(
      'page=0',
    )
  })

  it('sends past and the date range', () => {
    expect(
      eventListQuery(2, { past: true, from: '2026-12-01', to: '2026-12-31' }),
    ).toBe('page=2&past=true&from=2026-12-01&to=2026-12-31')
  })
})

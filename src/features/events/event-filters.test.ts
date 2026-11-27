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
  it('keeps legacy past links working with the date range', () => {
    expect(
      parseEventFilters(
        new URLSearchParams('past=true&from=2026-12-01&to=2026-12-31'),
      ),
    ).toEqual({ status: 'ended', from: '2026-12-01', to: '2026-12-31' })
  })

  it('reads the scheduled status from the URL', () => {
    expect(
      parseEventFilters(new URLSearchParams('status=scheduled')).status,
    ).toBe('scheduled')
  })

  it('drops malformed values', () => {
    expect(
      parseEventFilters(new URLSearchParams('past=1&from=tomorrow&to=')),
    ).toEqual({ status: 'ongoing', from: null, to: null })
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
    expect(isDateRangeValid({ status: 'ongoing', from, to })).toBe(true)
  })

  it('rejects from later than to', () => {
    expect(
      isDateRangeValid({
        status: 'ongoing',
        from: '2026-12-31',
        to: '2026-12-01',
      }),
    ).toBe(false)
  })
})

it('reports whether any filter is set', () => {
  expect(hasEventFilters({ status: 'ongoing', from: null, to: null })).toBe(
    false,
  )
  expect(hasEventFilters({ status: 'ended', from: null, to: null })).toBe(true)
  expect(
    hasEventFilters({ status: 'ongoing', from: null, to: '2026-12-01' }),
  ).toBe(true)
})

describe('withEventFilters', () => {
  it('sets the filters, keeps other params and resets the page', () => {
    const next = withEventFilters(
      new URLSearchParams('page=3&past=true&region=SIHEUNG&to=2026-12-01'),
      { status: 'ended', from: '2026-11-01', to: null },
    )
    expect(Object.fromEntries(next)).toEqual({
      region: 'SIHEUNG',
      status: 'ended',
      from: '2026-11-01',
    })
  })
})

describe('eventListQuery', () => {
  it('sends only the page by default', () => {
    expect(eventListQuery(0, { status: 'ongoing', from: null, to: null })).toBe(
      'page=0',
    )
  })

  it('sends past and the date range', () => {
    expect(
      eventListQuery(2, {
        status: 'ended',
        from: '2026-12-01',
        to: '2026-12-31',
      }),
    ).toBe('page=2&past=true&from=2026-12-01&to=2026-12-31')
  })
})

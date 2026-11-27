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
    ).toEqual({
      status: 'ended',
      from: '2026-12-01',
      to: '2026-12-31',
      category: null,
    })
  })

  it('reads the scheduled status from the URL', () => {
    expect(
      parseEventFilters(new URLSearchParams('status=scheduled')).status,
    ).toBe('scheduled')
  })

  it('reads a known category', () => {
    expect(
      parseEventFilters(new URLSearchParams('category=FESTIVAL')).category,
    ).toBe('FESTIVAL')
  })

  it('drops malformed values', () => {
    expect(
      parseEventFilters(
        new URLSearchParams('past=1&from=tomorrow&to=&category=festival'),
      ),
    ).toEqual({ status: 'ongoing', from: null, to: null, category: null })
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
    expect(
      isDateRangeValid({ status: 'ongoing', from, to, category: null }),
    ).toBe(true)
  })

  it('rejects from later than to', () => {
    expect(
      isDateRangeValid({
        status: 'ongoing',
        from: '2026-12-31',
        to: '2026-12-01',
        category: null,
      }),
    ).toBe(false)
  })
})

it('reports whether any filter is set', () => {
  expect(
    hasEventFilters({
      status: 'ongoing',
      from: null,
      to: null,
      category: null,
    }),
  ).toBe(false)
  expect(
    hasEventFilters({ status: 'ended', from: null, to: null, category: null }),
  ).toBe(true)
  expect(
    hasEventFilters({
      status: 'ongoing',
      from: null,
      to: '2026-12-01',
      category: null,
    }),
  ).toBe(true)
})

describe('withEventFilters', () => {
  it('sets the filters, keeps other params and resets the page', () => {
    const next = withEventFilters(
      new URLSearchParams('page=3&past=true&region=SIHEUNG&to=2026-12-01'),
      { status: 'ended', from: '2026-11-01', to: null, category: null },
    )
    expect(Object.fromEntries(next)).toEqual({
      region: 'SIHEUNG',
      status: 'ended',
      from: '2026-11-01',
    })
  })
})

it('treats a category as a filter', () => {
  expect(
    hasEventFilters({
      status: 'ongoing',
      from: null,
      to: null,
      category: 'EXHIBITION',
    }),
  ).toBe(true)
})

describe('withEventFilters and the category', () => {
  it('sets the category and removes it with the reset filters', () => {
    const set = withEventFilters(new URLSearchParams('page=2'), {
      status: 'ongoing',
      from: null,
      to: null,
      category: 'PERFORMANCE',
    })
    expect(Object.fromEntries(set)).toEqual({ category: 'PERFORMANCE' })
    expect(
      withEventFilters(set, {
        status: 'ongoing',
        from: null,
        to: null,
        category: null,
      }).toString(),
    ).toBe('')
  })
})

describe('eventListQuery', () => {
  it('sends the category', () => {
    expect(
      eventListQuery(0, {
        status: 'ongoing',
        from: null,
        to: null,
        category: 'EDUCATION',
      }),
    ).toBe('page=0&category=EDUCATION')
  })

  it('sends only the page by default', () => {
    expect(
      eventListQuery(0, {
        status: 'ongoing',
        from: null,
        to: null,
        category: null,
      }),
    ).toBe('page=0')
  })

  it('sends past and the date range', () => {
    expect(
      eventListQuery(2, {
        status: 'ended',
        from: '2026-12-01',
        to: '2026-12-31',
        category: null,
      }),
    ).toBe('page=2&past=true&from=2026-12-01&to=2026-12-31')
  })
})

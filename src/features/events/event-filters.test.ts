import { describe, expect, it } from 'vitest'
import {
  clearNarrowing,
  defaultEventFilters,
  eventListQuery,
  isSortAvailable,
  resetEventFilters,
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
      sort: 'DATE',
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
    ).toEqual({
      status: 'ongoing',
      from: null,
      to: null,
      category: null,
      sort: 'DATE',
    })
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
      isDateRangeValid({
        status: 'ongoing',
        from,
        to,
        category: null,
        sort: 'DATE',
      }),
    ).toBe(true)
  })

  it('rejects from later than to', () => {
    expect(
      isDateRangeValid({
        status: 'ongoing',
        from: '2026-12-31',
        to: '2026-12-01',
        category: null,
        sort: 'DATE',
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
      sort: 'DATE',
    }),
  ).toBe(false)
  expect(
    hasEventFilters({
      status: 'ended',
      from: null,
      to: null,
      category: null,
      sort: 'DATE',
    }),
  ).toBe(true)
  expect(
    hasEventFilters({
      status: 'ongoing',
      from: null,
      to: '2026-12-01',
      category: null,
      sort: 'DATE',
    }),
  ).toBe(true)
})

describe('withEventFilters', () => {
  it('sets the filters, keeps other params and resets the page', () => {
    const next = withEventFilters(
      new URLSearchParams('page=3&past=true&region=SIHEUNG&to=2026-12-01'),
      {
        status: 'ended',
        from: '2026-11-01',
        to: null,
        category: null,
        sort: 'DATE',
      },
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
      sort: 'DATE',
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
      sort: 'DATE',
    })
    expect(Object.fromEntries(set)).toEqual({ category: 'PERFORMANCE' })
    expect(
      withEventFilters(set, {
        status: 'ongoing',
        from: null,
        to: null,
        category: null,
        sort: 'DATE',
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
        sort: 'DATE',
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
        sort: 'DATE',
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
        sort: 'DATE',
      }),
    ).toBe('page=2&past=true&from=2026-12-01&to=2026-12-31')
  })
})

describe('sort', () => {
  it('reads a known sort and drops others', () => {
    expect(parseEventFilters(new URLSearchParams('sort=DEADLINE')).sort).toBe(
      'DEADLINE',
    )
    expect(parseEventFilters(new URLSearchParams('sort=near')).sort).toBe(
      'DATE',
    )
  })

  it('keeps a non-default sort in the URL and the request', () => {
    const filters = { ...defaultEventFilters, sort: 'LATEST' as const }
    expect(
      withEventFilters(new URLSearchParams('page=1'), filters).toString(),
    ).toBe('sort=LATEST')
    expect(eventListQuery(0, filters)).toBe('page=0&sort=LATEST')
  })

  it('is not a filter, and resets keep it', () => {
    const filters = {
      ...defaultEventFilters,
      status: 'ended' as const,
      category: 'FESTIVAL' as const,
      from: '2026-11-01',
      sort: 'DEADLINE' as const,
    }
    expect(hasEventFilters({ ...defaultEventFilters, sort: 'LATEST' })).toBe(
      false,
    )
    expect(resetEventFilters(filters)).toEqual({
      ...defaultEventFilters,
      sort: 'DEADLINE',
    })
    expect(clearNarrowing(filters)).toEqual({
      ...defaultEventFilters,
      status: 'ended',
      sort: 'DEADLINE',
    })
  })

  it('works only where the list comes straight from the BE order', () => {
    const today = '2026-11-28'
    const with_ = (over: Partial<typeof defaultEventFilters>) =>
      isSortAvailable({ ...defaultEventFilters, ...over }, today)
    expect(with_({})).toBe(true)
    expect(with_({ status: 'ended' })).toBe(true)
    expect(with_({ status: 'scheduled' })).toBe(false)
    expect(with_({ from: '2026-12-01' })).toBe(false)
    expect(with_({ from: today })).toBe(true)
  })
})

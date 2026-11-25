import { expect, it } from 'vitest'
import { calendarSearch, readCalendarLocation } from './calendar-location'

const today = '2026-11-25'
const read = (query: string) =>
  readCalendarLocation(new URLSearchParams(query), today)

it('defaults to the current month and rejects invalid or out-of-range months', () => {
  for (const query of ['', 'month=1999-12', 'month=2101-01', 'month=2026-13']) {
    expect(read(query)).toEqual({ month: '2026-11', date: null })
  }
  expect(read('month=2000-01&date=2000-01-01')).toEqual({
    month: '2000-01',
    date: '2000-01-01',
  })
})

it('round-trips the selected date and ignores invalid or out-of-month dates', () => {
  expect(
    readCalendarLocation(calendarSearch('2028-02', '2028-02-29'), today),
  ).toEqual({ month: '2028-02', date: '2028-02-29' })
  for (const date of ['2027-02-29', '2027-02-00', '2027-03-01']) {
    expect(read(`month=2027-02&date=${date}`)).toEqual({
      month: '2027-02',
      date: null,
    })
  }
})

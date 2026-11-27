import { expect, it } from 'vitest'
import { koreaToday } from '@/shared/i18n/format'
import { listMockEvents, mockEvents } from './events'

const events = mockEvents('ko')
const list = (query: string) =>
  listMockEvents(events, new URLSearchParams(query)).map(
    ({ eventId }) => eventId,
  )

it('lists ongoing and upcoming events by default, nearest start first', () => {
  const today = koreaToday()
  const ids = list('')
  expect(ids).toEqual([1, 2, 3, 4])
  for (const id of ids) expect(events[id - 1].endsOn! >= today).toBe(true)
})

it('lists past events, most recently ended first', () => {
  expect(list('past=true')).toEqual([6, 5])
})

it('keeps events that overlap the period by at least a day', () => {
  const first = events[1].startsOn!
  expect(list(`to=${first}`)).toEqual([1, 2])
  expect(list(`past=true&from=${events[5].endsOn}`)).toEqual([6])
})

it('filters by category like the BE, ignoring case', () => {
  expect(list('category=EDUCATION')).toEqual([1, 2])
  expect(list('category=festival&past=true')).toEqual([5])
  expect(events[0].categoryName).toBe('교육·체험')
})

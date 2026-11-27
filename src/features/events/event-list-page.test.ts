import { describe, expect, it, vi } from 'vitest'
import { mockEvents } from '@/mocks/handlers/events'
import { fetchActiveEventPage } from './event-list-page'

const today = '2026-11-27'
const size = 3
const [sample] = mockEvents('ko')

function activePages(ongoing: number, scheduled: number) {
  const events = Array.from({ length: ongoing + scheduled }, (_, index) => ({
    ...sample,
    eventId: index + 1,
    startsOn: index < ongoing ? today : null,
    endsOn: '2026-12-01',
  }))
  return vi.fn(async (page: number) => ({
    page,
    size,
    content: events.slice(page * size, (page + 1) * size),
    totalElements: events.length,
    totalPages: Math.ceil(events.length / size),
    hasNext: (page + 1) * size < events.length,
  }))
}

describe('fetchActiveEventPage', () => {
  it('fills scheduled pages across server page boundaries', async () => {
    const fetchPage = activePages(7, 4)
    const first = await fetchActiveEventPage(0, today, 'scheduled', fetchPage)
    const last = await fetchActiveEventPage(1, today, 'scheduled', fetchPage)

    expect(first.content.map(({ eventId }) => eventId)).toEqual([8, 9, 10])
    expect(first).toMatchObject({
      totalElements: 4,
      totalPages: 2,
      hasNext: true,
    })
    expect(last.content.map(({ eventId }) => eventId)).toEqual([11])
    expect(last).toMatchObject({
      totalElements: 4,
      totalPages: 2,
      hasNext: false,
    })
  })

  it('still lists ongoing events that overlap a future period', async () => {
    const result = await fetchActiveEventPage(
      1,
      today,
      'ongoing',
      activePages(4, 5),
    )
    expect(result.content.map(({ eventId }) => eventId)).toEqual([4])
    expect(result).toMatchObject({
      totalElements: 4,
      totalPages: 2,
      hasNext: false,
    })
  })

  it('returns an empty scheduled list when there are only ongoing events', async () => {
    const result = await fetchActiveEventPage(
      0,
      today,
      'scheduled',
      activePages(8, 0),
    )
    expect(result).toMatchObject({
      content: [],
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
    })
  })
})

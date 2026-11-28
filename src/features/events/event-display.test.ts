import { describe, expect, it } from 'vitest'
import { eventLink, eventStatus, formatCollectedAt } from './event-display'

it('allows only absolute web links for backend-provided event destinations', () => {
  expect(eventLink('https://www.siheung.go.kr')).toBe(
    'https://www.siheung.go.kr/',
  )
  expect(eventLink('http://example.org/apply')).toBe('http://example.org/apply')
  for (const value of [
    null,
    '/events',
    '//example.org/apply',
    'javascript:alert(1)',
    'data:text/html,hello',
  ]) {
    expect(eventLink(value)).toBeUndefined()
  }
})

describe('eventStatus', () => {
  const today = '2026-11-28'
  it.each([
    ['2026-11-20', '2026-12-01', 'ongoing'],
    ['2026-11-28', null, 'ongoing'],
    ['2026-11-29', '2026-11-30', 'soon'],
    ['2026-12-05', '2026-12-06', 'soon'],
    ['2026-12-06', '2026-12-07', 'planned'],
    ['2026-11-01', '2026-11-27', undefined],
    [null, null, undefined],
  ] as const)('%s – %s is %s', (startsOn, endsOn, status) => {
    expect(eventStatus({ startsOn, endsOn }, today)).toBe(status)
  })
})

it('shows the collection time in Korea time', () => {
  expect(formatCollectedAt('2026-11-12T18:00:00Z', 'ko')).toBe('11. 13. 03:00')
  expect(formatCollectedAt('not a date', 'ko')).toBe('')
})

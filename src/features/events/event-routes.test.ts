import { expect, it } from 'vitest'
import { eventDetailBackPath } from './event-routes'

it.each(['/chat/42', '/home', '/events?page=2', '/calendar?month=2026-12'])(
  'returns to %s from event details',
  (path) => {
    expect(eventDetailBackPath(path)).toBe(path)
  },
)

it.each([
  undefined,
  '/chat',
  '/chat/history',
  '/chat/0',
  '/chat/9007199254740992',
  '/chat/1?next=/home',
  '/chat/1/extra',
  '//example.test/chat/1',
  'https://example.test/chat/1',
])('uses the event list for unsupported return path %j', (path) => {
  expect(eventDetailBackPath(path)).toBe('/events')
})

import { expect, it } from 'vitest'
import { eventLink } from './event-display'

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

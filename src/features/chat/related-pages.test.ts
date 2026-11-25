import { expect, it } from 'vitest'
import { relatedPagePath } from './related-pages'

it.each(['1', '9223372036854775807'])('keeps event ID %s intact', (code) => {
  expect(relatedPagePath({ type: 'EVENT', code, title: '행사' })).toBe(
    `/events/${code}`,
  )
})

it.each(['', '0', '01', '-1', '1.5', '1\n', '1/2', '12345678901234567890'])(
  'leaves an event with invalid ID %j unlinked',
  (code) => {
    expect(
      relatedPagePath({ type: 'EVENT', code, title: '행사' }),
    ).toBeUndefined()
  },
)

it.each(['CHECKLIST', 'LIFE_CHANGE_TASK', 'RULE'] as const)(
  'leaves %s unlinked even with a numeric code',
  (type) => {
    expect(
      relatedPagePath({ type, code: '1', title: '관련 내용' }),
    ).toBeUndefined()
  },
)

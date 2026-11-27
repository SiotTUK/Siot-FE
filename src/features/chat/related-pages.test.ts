import { expect, it } from 'vitest'
import type { RelatedPage } from './api'
import { relatedPagePath } from './related-pages'

const path = (type: RelatedPage['type'], code: string) =>
  relatedPagePath({ type, code, title: '관련 내용' })

it.each(['1', '9223372036854775807'])('keeps event ID %s intact', (code) => {
  expect(path('EVENT', code)).toBe(`/events/${code}`)
})

it.each(['', '0', '01', '-1', '1.5', '1\n', '1/2', '12345678901234567890'])(
  'leaves an event with invalid ID %j unlinked',
  (code) => {
    expect(path('EVENT', code)).toBeUndefined()
  },
)

it('links a rule by its slug', () => {
  expect(path('RULE', 'waste-food')).toBe('/rules/waste-food')
})

it('links a checklist item to its detail', () => {
  expect(path('CHECKLIST', 'CL-01')).toBe('/home/checklist/CL-01')
})

it.each([
  ['LC-01-1', '/home/life-changes/LC-01'],
  ['LC-08-12', '/home/life-changes/LC-08'],
])('links life change task %s to its life change', (code, expected) => {
  expect(path('LIFE_CHANGE_TASK', code)).toBe(expected)
})

it.each([
  ['RULE', ''],
  ['RULE', 'Waste-Food'],
  ['RULE', '../admin'],
  ['RULE', 'waste/food'],
  ['CHECKLIST', ''],
  ['CHECKLIST', '1'],
  ['CHECKLIST', 'CL-1'],
  ['CHECKLIST', 'CL-01/x'],
  ['CHECKLIST', 'LC-01-1'],
  ['LIFE_CHANGE_TASK', 'LC-01'],
  ['LIFE_CHANGE_TASK', 'LC-09-1'],
  ['LIFE_CHANGE_TASK', 'LC-01-0'],
  ['LIFE_CHANGE_TASK', 'LC-01-1/x'],
  ['LIFE_CHANGE_TASK', 'CL-01'],
] as const)('leaves %s %j unlinked', (type, code) => {
  expect(path(type, code)).toBeUndefined()
})

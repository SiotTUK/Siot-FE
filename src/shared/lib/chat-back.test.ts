import { expect, it } from 'vitest'
import { chatBackPath } from './chat-back'

it('returns the conversation the screen was opened from', () => {
  expect(chatBackPath({ from: '/chat/12' })).toBe('/chat/12')
})

it.each([
  null,
  undefined,
  {},
  { from: 12 },
  { from: '/chat' },
  { from: '/chat/0' },
  { from: '/chat/12?x=1' },
  { from: '/chat/99999999999999999999' },
  { from: 'https://example.com/chat/1' },
  { from: 'rules' },
])('ignores %j', (state) => {
  expect(chatBackPath(state)).toBeUndefined()
})

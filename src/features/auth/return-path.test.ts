import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authLinkState,
  clearReturnPath,
  peekReturnPath,
  rememberReturnPath,
  returnPath,
  returnState,
} from './return-path'

describe('returnPath', () => {
  it.each(['/events/123?from=list', '/home', '/chat/7', '/rules/waste-food'])(
    'keeps the app path %s with its query',
    (from) => {
      expect(returnPath(from)).toBe(from)
    },
  )

  it.each([
    undefined,
    42,
    '',
    'events/1',
    '//evil.example/x',
    '/\\evil.example',
    'https://evil.example/',
    '/',
    '/login?x=1',
    '/signup',
    '/password-reset?token=abc',
    '/onboarding/type',
  ])('rejects %j', (from) => {
    expect(returnPath(from)).toBeUndefined()
  })
})

it('passes the return path on between the auth screens', () => {
  const state = { from: '/events/123?from=list', back: '/' }
  expect(returnState(state)).toEqual({ from: '/events/123?from=list' })
  expect(authLinkState('/login', state)).toEqual({
    back: '/login',
    from: '/events/123?from=list',
  })
  // A direct visit has nothing to carry; the back path stays.
  expect(returnState(null)).toBeUndefined()
  expect(authLinkState('/login', null)).toEqual({ back: '/login' })
  expect(authLinkState('/login', { from: '//evil.example' })).toEqual({
    back: '/login',
  })
})

describe('return path kept through onboarding', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
      removeItem: (key: string) => items.delete(key),
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the path to the same member until it is cleared', () => {
    rememberReturnPath(5, '/events/123?from=list')
    expect(peekReturnPath(6)).toBeUndefined()
    // Reading twice (a re-render) gives the same answer.
    expect(peekReturnPath(5)).toBe('/events/123?from=list')
    expect(peekReturnPath(5)).toBe('/events/123?from=list')
    clearReturnPath()
    expect(peekReturnPath(5)).toBeUndefined()
  })

  it('clears an older path when the member comes in without one', () => {
    rememberReturnPath(5, '/events/123')
    rememberReturnPath(5, undefined)
    expect(peekReturnPath(5)).toBeUndefined()
  })

  it('works without storage', () => {
    vi.stubGlobal('sessionStorage', undefined)
    expect(() => rememberReturnPath(5, '/home')).not.toThrow()
    expect(() => clearReturnPath()).not.toThrow()
    expect(peekReturnPath(5)).toBeUndefined()
  })
})

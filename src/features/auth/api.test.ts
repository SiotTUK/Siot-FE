import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveOnboarding } from '@/features/onboarding/api'
import { mockResetToken, mockSignupCode } from '@/mocks/handlers'
import {
  confirmPasswordReset,
  confirmSignupCode,
  fetchMe,
  login,
  logout,
  requestPasswordReset,
  sendSignupCode,
  signup,
  validatePasswordResetToken,
  withdraw,
} from './api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      interceptedFetch(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('signup → onboarding flow', () => {
  it('verifies the email, signs up logged in and saves onboarding', async () => {
    await expect(fetchMe()).resolves.toBeNull()

    const sent = await sendSignupCode({
      email: ' New@Example.com ',
      language: 'vi',
    })
    expect(sent).toMatchObject({
      email: 'new@example.com',
      resendAvailableInSeconds: 60,
    })
    await expect(
      sendSignupCode({ email: 'new@example.com', language: 'vi' }),
    ).rejects.toMatchObject({ code: 'EMAIL_VERIFICATION_TOO_FREQUENT' })

    await expect(
      confirmSignupCode({ email: 'new@example.com', code: '000000' }),
    ).rejects.toMatchObject({ code: 'EMAIL_VERIFICATION_CODE_INVALID' })
    await confirmSignupCode({ email: 'new@example.com', code: mockSignupCode })

    const member = await signup({
      email: 'new@example.com',
      password: 'abcd1234',
      passwordConfirm: 'abcd1234',
      language: 'vi',
    })
    expect(member).toMatchObject({
      language: 'vi',
      onboarded: false,
      userType: null,
    })
    expect(member).not.toHaveProperty('password')

    const onboarded = await saveOnboarding({
      userType: 'NEW',
      entryDate: '2026-11-01',
      purpose: null,
      residences: ['KIDS'],
      stayExpiry: null,
    })
    expect(onboarded).toMatchObject({
      onboarded: true,
      userType: 'NEW',
      purpose: null,
      residences: ['KIDS'],
    })
    await expect(fetchMe()).resolves.toMatchObject({ onboarded: true })

    await logout()
    await expect(fetchMe()).resolves.toBeNull()
  })

  it('rejects signup before the email is verified', async () => {
    await expect(
      signup({
        email: 'skip@example.com',
        password: 'abcd1234',
        passwordConfirm: 'abcd1234',
        language: 'ko',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'EMAIL_NOT_VERIFIED' })
  })

  it('rejects an already registered email when sending a code', async () => {
    await expect(
      sendSignupCode({ email: 'taken@example.com', language: 'ko' }),
    ).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_EMAIL' })
  })

  it('rejects onboarding without a session', async () => {
    await expect(
      saveOnboarding({
        userType: 'NEW',
        entryDate: null,
        purpose: null,
        residences: [],
        stayExpiry: null,
      }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  })
})

describe('login', () => {
  it('reports attempts, then locks after five failures', async () => {
    const wrong = { email: 'taken@example.com', password: 'wrong123' }
    await expect(login(wrong)).rejects.toMatchObject({
      code: 'LOGIN_FAILED',
      details: { failedAttempts: 1, maxAttempts: 5, remainingAttempts: 4 },
    })
    for (let attempt = 2; attempt <= 4; attempt += 1)
      await login(wrong).catch(() => undefined)
    await expect(login(wrong)).rejects.toMatchObject({
      details: { remainingAttempts: 0 },
    })
    await expect(
      login({ email: 'taken@example.com', password: 'abcd1234' }),
    ).rejects.toMatchObject({ status: 429, code: 'LOGIN_LOCKED' })
  })

  it('returns the member for valid credentials', async () => {
    await expect(
      login({ email: 'TAKEN@example.com', password: 'abcd1234' }),
    ).resolves.toMatchObject({ email: 'taken@example.com', onboarded: true })
  })
})

describe('password reset', () => {
  it('accepts a 202 without a body for any email', async () => {
    await expect(
      requestPasswordReset({ email: 'nobody@example.com' }),
    ).resolves.toBeUndefined()
    await expect(
      requestPasswordReset({ email: 'nobody@example.com' }),
    ).rejects.toMatchObject({ code: 'PASSWORD_RESET_TOO_FREQUENT' })
  })

  it('validates the link and keeps it usable after a rule violation', async () => {
    await expect(validatePasswordResetToken('expired')).rejects.toMatchObject({
      code: 'PASSWORD_RESET_TOKEN_INVALID',
    })
    await expect(validatePasswordResetToken(mockResetToken)).resolves.toBe(true)

    await expect(
      confirmPasswordReset({
        token: mockResetToken,
        password: 'short1',
        passwordConfirm: 'short1',
      }),
    ).rejects.toMatchObject({ code: 'PASSWORD_LENGTH' })
    await confirmPasswordReset({
      token: mockResetToken,
      password: 'newpass5678',
      passwordConfirm: 'newpass5678',
    })
    await expect(
      login({ email: 'taken@example.com', password: 'newpass5678' }),
    ).resolves.toMatchObject({ email: 'taken@example.com' })
  })
})

describe('withdrawal', () => {
  it('rejects a wrong password with 400, then deletes the account', async () => {
    await login({ email: 'taken@example.com', password: 'abcd1234' })
    await expect(withdraw('wrong1234')).rejects.toMatchObject({
      status: 400,
      code: 'PASSWORD_INCORRECT',
    })
    await expect(fetchMe()).resolves.toMatchObject({ onboarded: true })

    await withdraw('abcd1234')
    await expect(fetchMe()).resolves.toBeNull()
    await expect(
      login({ email: 'taken@example.com', password: 'abcd1234' }),
    ).rejects.toMatchObject({ code: 'LOGIN_FAILED' })
  })

  it('requires login', async () => {
    await expect(withdraw('abcd1234')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })
})

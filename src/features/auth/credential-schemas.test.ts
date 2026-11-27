import { describe, expect, it } from 'vitest'
import { loginSchema, withdrawalSchema } from './credential-schemas'

const issues = (result: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}) =>
  result.success
    ? []
    : result.error!.issues.map((issue) => [issue.path.join('.'), issue.message])

describe('login and withdrawal checks (same as the BE request checks)', () => {
  const email = 'user@example.com'

  it('accepts a normal login and keeps the password as typed', () => {
    const result = loginSchema.safeParse({
      email: ` ${email} `,
      password: ' abcd1234',
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ email, password: ' abcd1234' })
  })

  it.each([
    ['', 'validation.passwordRequired'],
    ['   ', 'validation.passwordRequired'],
    ['a'.repeat(65), 'errors.LOGIN_FAILED'],
  ])('login password %j → %s', (password, message) => {
    expect(issues(loginSchema.safeParse({ email, password }))).toEqual([
      ['password', message],
    ])
  })

  it('allows a 64-character login password', () => {
    expect(
      loginSchema.safeParse({ email, password: 'a'.repeat(64) }).success,
    ).toBe(true)
  })

  it('treats an email over 255 characters as a failed login', () => {
    const long = `${'a'.repeat(244)}@example.com` // 256 characters
    expect(
      issues(loginSchema.safeParse({ email: long, password: 'abcd1234' })),
    ).toEqual([['email', 'errors.LOGIN_FAILED']])
    expect(
      issues(loginSchema.safeParse({ email: '  ', password: 'abcd1234' })),
    ).toEqual([['email', 'validation.emailRequired']])
  })

  it.each([
    ['', 'validation.passwordRequired'],
    ['   ', 'validation.passwordRequired'],
    ['a'.repeat(65), 'errors.PASSWORD_INCORRECT'],
  ])('withdrawal password %j → %s', (password, message) => {
    expect(issues(withdrawalSchema.safeParse({ password }))).toEqual([
      ['password', message],
    ])
  })

  it('allows a 64-character withdrawal password', () => {
    expect(
      withdrawalSchema.safeParse({ password: 'a'.repeat(64) }).success,
    ).toBe(true)
  })
})

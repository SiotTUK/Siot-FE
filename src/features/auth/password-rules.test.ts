import { describe, expect, it } from 'vitest'
import {
  checkPasswordRules,
  fieldForErrorCode,
  firstPasswordError,
} from './password-rules'

describe('password rules', () => {
  it('marks each rule while typing', () => {
    expect(checkPasswordRules('abcd1234', 'user@example.com')).toEqual({
      length: true,
      letterAndDigit: true,
      allowedCharacters: true,
      noWhitespace: true,
      notEmail: true,
    })
    expect(checkPasswordRules('abc 12', 'user@example.com')).toEqual({
      length: false,
      letterAndDigit: true,
      allowedCharacters: true,
      noWhitespace: false,
      notEmail: true,
    })
  })

  it('allows only letters, digits and special characters (M-03)', () => {
    expect(checkPasswordRules('abcd1234!@#').allowedCharacters).toBe(true)
    expect(checkPasswordRules('비밀번호abcd1234').allowedCharacters).toBe(false)
  })

  it('treats an empty password as not yet meeting any rule', () => {
    expect(Object.values(checkPasswordRules(''))).not.toContain(true)
  })

  it('rejects a password equal to the email regardless of case', () => {
    expect(
      checkPasswordRules('User1@Example.com', ' user1@example.com ').notEmail,
    ).toBe(false)
  })

  it.each([
    ['', 'validation.passwordRequired'],
    ['a1', 'errors.PASSWORD_LENGTH'],
    [`a1${'b'.repeat(63)}`, 'errors.PASSWORD_LENGTH'],
    ['abcd 1234', 'errors.PASSWORD_WHITESPACE'],
    ['abcd1234가', 'errors.PASSWORD_INVALID_CHARACTER'],
    ['abcdefgh', 'errors.PASSWORD_LETTER_AND_DIGIT_REQUIRED'],
    ['12345678', 'errors.PASSWORD_LETTER_AND_DIGIT_REQUIRED'],
    ['a1@b.com', 'errors.PASSWORD_SAME_AS_EMAIL'],
    ['abcd1234', undefined],
  ])('reports the first broken rule for %j', (password, expected) => {
    expect(firstPasswordError(password, 'a1@b.com')).toBe(expected)
  })

  it.each([
    ['DUPLICATE_EMAIL', 'email'],
    ['EMAIL_NOT_VERIFIED', 'code'],
    ['EMAIL_VERIFICATION_EXPIRED', 'code'],
    ['PASSWORD_INVALID_CHARACTER', 'password'],
    ['PASSWORD_CONFIRM_MISMATCH', 'passwordConfirm'],
    ['PASSWORD_RESET_TOKEN_INVALID', undefined],
    ['INTERNAL_ERROR', undefined],
  ])('places server error %s on the %s field', (code, field) => {
    expect(fieldForErrorCode(code)).toBe(field)
  })
})

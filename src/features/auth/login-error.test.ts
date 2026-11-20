import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import i18n from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { loginErrorMessage } from './login-error'

const ko = i18n.getFixedT('ko')
const en = i18n.getFixedT('en')

const loginFailed = (failedAttempts: number) =>
  new ApiError(401, {
    code: 'LOGIN_FAILED',
    message: '이메일 또는 비밀번호가 맞지 않습니다.',
    details: {
      failedAttempts,
      maxAttempts: 5,
      remainingAttempts: 5 - failedAttempts,
    },
  })

describe('login error messages', () => {
  it('shows the attempt count from LOGIN_FAILED details', () => {
    expect(loginErrorMessage(ko, loginFailed(2))).toBe(
      '이메일 또는 비밀번호가 맞지 않아요 (2/5) · 5번 틀리면 5분 동안 로그인할 수 없어요',
    )
    expect(loginErrorMessage(en, loginFailed(2))).toContain('(2/5)')
  })

  it('treats the fifth failure as locked', () => {
    expect(loginErrorMessage(ko, loginFailed(5))).toBe(
      ko('errors.LOGIN_LOCKED'),
    )
  })

  it('falls back to the plain code message without details', () => {
    const error = new ApiError(401, { code: 'LOGIN_FAILED', message: 'x' })
    expect(loginErrorMessage(en, error)).toBe('Incorrect email or password')
  })
})

describe('server error messages', () => {
  it('translates known codes into the current language', () => {
    const error = new ApiError(409, {
      code: 'DUPLICATE_EMAIL',
      message: '이미 가입한 이메일입니다.',
    })
    expect(errorMessage(en, error)).toBe('This email is already registered')
  })

  it('shows the server message for an unknown code', () => {
    const error = new ApiError(400, { code: 'NEW_CODE', message: '새 오류' })
    expect(errorMessage(en, error)).toBe('새 오류')
  })

  it('separates network failures and proxy errors', () => {
    expect(errorMessage(ko, new TypeError('Failed to fetch'))).toBe(
      ko('errors.NETWORK'),
    )
    const gateway = new ApiError(502, { code: 'HTTP_ERROR', message: 'Bad' })
    expect(errorMessage(ko, gateway)).toBe(ko('errors.UNKNOWN'))
  })
})

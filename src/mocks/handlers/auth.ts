import { http, HttpResponse } from 'msw'
import {
  body,
  error,
  isEmail,
  normalize,
  passwordError,
  persist,
  publicMember,
  state,
  toLanguage,
  mockSignupCode,
  mockResetToken,
  type MockMember,
} from '../db'

/** Signup with email code, login, logout, password reset. */
export const authHandlers = [
  http.get(
    '*/api/auth/csrf',
    () =>
      new HttpResponse(null, {
        status: 204,
        headers: {
          'Set-Cookie': 'XSRF-TOKEN=mock-csrf-token; Path=/; SameSite=Lax',
        },
      }),
  ),

  http.get('*/api/auth/email/availability', ({ request }) => {
    const email = normalize(new URL(request.url).searchParams.get('email'))
    if (!isEmail(email))
      return error(400, 'EMAIL_FORMAT', '이메일 형식이 올바르지 않습니다.')
    return HttpResponse.json({
      data: { email, available: !state.members[email] },
    })
  }),

  http.post('*/api/auth/signup/email-verification', async ({ request }) => {
    const email = normalize((await body(request)).email)
    if (!isEmail(email))
      return error(400, 'EMAIL_FORMAT', '이메일 형식으로 입력해 주세요.')
    if (state.members[email])
      return error(409, 'DUPLICATE_EMAIL', '이미 가입한 이메일입니다.')
    const previous = state.codes[email]
    if (previous && Date.now() - previous.sentAt < 60_000)
      return error(
        429,
        'EMAIL_VERIFICATION_TOO_FREQUENT',
        '인증 코드는 1분에 한 번만 요청할 수 있습니다.',
      )
    state.codes[email] = {
      code: mockSignupCode,
      sentAt: Date.now(),
      attempts: 0,
    }
    persist()
    return HttpResponse.json(
      { data: { email, expiresInSeconds: 600, resendAvailableInSeconds: 60 } },
      { status: 202 },
    )
  }),

  http.post(
    '*/api/auth/signup/email-verification/confirm',
    async ({ request }) => {
      const input = await body(request)
      const email = normalize(input.email)
      const code = typeof input.code === 'string' ? input.code.trim() : ''
      const sent = state.codes[email]
      if (!/^\d{6}$/.test(code))
        return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
      if (!sent || sent.attempts >= 5 || Date.now() - sent.sentAt > 600_000)
        return error(
          400,
          'EMAIL_VERIFICATION_EXPIRED',
          '인증 코드가 만료되었습니다. 코드를 다시 요청해 주세요.',
        )
      if (sent.code !== code) {
        sent.attempts += 1
        persist()
        return error(
          400,
          'EMAIL_VERIFICATION_CODE_INVALID',
          '인증 코드가 맞지 않습니다.',
        )
      }
      delete state.codes[email]
      state.verifiedAt[email] = Date.now()
      persist()
      return new HttpResponse(null, { status: 204 })
    },
  ),

  http.post('*/api/auth/signup', async ({ request }) => {
    const input = await body(request)
    const email = normalize(input.email)
    if (!isEmail(email))
      return error(400, 'EMAIL_FORMAT', '이메일 형식으로 입력해 주세요.')
    if (state.members[email])
      return error(409, 'DUPLICATE_EMAIL', '이미 가입한 이메일입니다.')
    const verifiedAt = state.verifiedAt[email]
    if (!verifiedAt || Date.now() - verifiedAt > 30 * 60_000)
      return error(
        400,
        'EMAIL_NOT_VERIFIED',
        '이메일 인증을 먼저 완료해 주세요.',
      )
    const code = passwordError(input.password, input.passwordConfirm, email)
    if (code) return error(400, code, '비밀번호 규칙을 확인해 주세요.')
    delete state.verifiedAt[email]
    const member: MockMember = {
      id: state.nextId++,
      email,
      password: input.password as string,
      role: 'USER',
      language: toLanguage(input.language),
      userType: null,
      entryDate: null,
      purpose: null,
      residences: [],
      stayExpiry: null,
      emailVerified: true,
      onboarded: false,
    }
    state.members[email] = member
    state.sessionEmail = email
    persist()
    return HttpResponse.json({ data: publicMember(member) }, { status: 201 })
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const input = await body(request)
    const email = normalize(input.email)
    const failures = (state.loginFailures[email] ??= {
      count: 0,
      lockedUntil: 0,
    })
    if (failures.lockedUntil > Date.now())
      return error(
        429,
        'LOGIN_LOCKED',
        '로그인에 5회 연속 실패하여 5분 동안 로그인할 수 없습니다.',
      )
    const member = state.members[email]
    if (!member || member.password !== input.password) {
      failures.count += 1
      if (failures.count >= 5) {
        failures.lockedUntil = Date.now() + 5 * 60_000
        failures.count = 5
      }
      const details = {
        failedAttempts: failures.count,
        maxAttempts: 5,
        remainingAttempts: 5 - failures.count,
      }
      if (failures.count >= 5) failures.count = 0
      persist()
      return error(
        401,
        'LOGIN_FAILED',
        '이메일 또는 비밀번호가 맞지 않습니다.',
        details,
      )
    }
    delete state.loginFailures[email]
    state.sessionEmail = email
    persist()
    return HttpResponse.json({ data: publicMember(member) })
  }),

  http.post('*/api/auth/logout', () => {
    state.sessionEmail = null
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/auth/password-reset', async ({ request }) => {
    const email = normalize((await body(request)).email)
    if (!email)
      return error(400, 'INVALID_INPUT', '요청 값이 올바르지 않습니다.')
    const sentAt = state.resetSentAt[email]
    if (sentAt && Date.now() - sentAt < 60_000)
      return error(
        429,
        'PASSWORD_RESET_TOO_FREQUENT',
        '비밀번호 재설정은 1분에 한 번만 요청할 수 있습니다.',
      )
    state.resetSentAt[email] = Date.now()
    persist()
    // Always 202 without a body, whether or not the email is registered.
    return new HttpResponse(null, { status: 202 })
  }),

  http.get('*/api/auth/password-reset/validation', ({ request }) =>
    new URL(request.url).searchParams.get('token') === mockResetToken
      ? new HttpResponse(null, { status: 204 })
      : error(
          400,
          'PASSWORD_RESET_TOKEN_INVALID',
          '재설정 링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.',
        ),
  ),

  http.post('*/api/auth/password-reset/confirm', async ({ request }) => {
    const input = await body(request)
    if (input.token !== mockResetToken)
      return error(
        400,
        'PASSWORD_RESET_TOKEN_INVALID',
        '재설정 링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.',
      )
    const member = state.members['taken@example.com']
    const code = passwordError(
      input.password,
      input.passwordConfirm,
      member.email,
    )
    if (code) return error(400, code, '비밀번호 규칙을 확인해 주세요.')
    member.password = input.password as string
    if (state.sessionEmail === member.email) state.sessionEmail = null
    delete state.loginFailures[member.email]
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  // Chatbot (CB-03·04·08·09·11·16). Canned answers by keyword, not real RAG.,
]

import { queryOptions } from '@tanstack/react-query'
import { ApiError, apiRequest } from '@/shared/api/client'
import type { Language, MemberResponse } from '@/shared/api/types'

export interface SignupVerificationResponse {
  email: string
  expiresInSeconds: number
  resendAvailableInSeconds: number
}

export interface SignupRequest {
  email: string
  password: string
  passwordConfirm: string
  language: Language
}

export interface LoginRequest {
  email: string
  password: string
}

export interface PasswordResetConfirmRequest {
  token: string
  password: string
  passwordConfirm: string
}

/** Login failure details from LOGIN_FAILED (`(2/5)` on the login screen). */
export interface LoginFailedDetails {
  failedAttempts: number
  maxAttempts: number
  remainingAttempts: number
}

export const meQueryKey = ['me'] as const

/** 200 = logged in, 401 = logged out (null). Other failures stay errors. */
export async function fetchMe(): Promise<MemberResponse | null> {
  try {
    return await apiRequest<MemberResponse>('/api/members/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export const meQueryOptions = queryOptions({
  queryKey: meQueryKey,
  queryFn: fetchMe,
})

/** M-02: `email` comes back trimmed and lower-cased. */
export interface EmailAvailabilityResponse {
  email: string
  available: boolean
}

export function checkEmailAvailability(email: string) {
  return apiRequest<EmailAvailabilityResponse>(
    `/api/auth/email/availability?email=${encodeURIComponent(email)}`,
  )
}

export function sendSignupCode(body: { email: string; language: Language }) {
  return apiRequest<SignupVerificationResponse>(
    '/api/auth/signup/email-verification',
    { method: 'POST', body },
  )
}

export function confirmSignupCode(body: { email: string; code: string }) {
  return apiRequest('/api/auth/signup/email-verification/confirm', {
    method: 'POST',
    body,
  })
}

export function signup(body: SignupRequest) {
  return apiRequest<MemberResponse>('/api/auth/signup', {
    method: 'POST',
    body,
  })
}

export function login(body: LoginRequest) {
  return apiRequest<MemberResponse>('/api/auth/login', {
    method: 'POST',
    body,
  })
}

export function logout() {
  return apiRequest('/api/auth/logout', { method: 'POST' })
}

export function requestPasswordReset(body: { email: string }) {
  return apiRequest('/api/auth/password-reset', { method: 'POST', body })
}

/** 204 = valid link. Resolves `true` because TanStack Query rejects `undefined` data. */
export async function validatePasswordResetToken(token: string) {
  await apiRequest(
    `/api/auth/password-reset/validation?token=${encodeURIComponent(token)}`,
  )
  return true as const
}

export function confirmPasswordReset(body: PasswordResetConfirmRequest) {
  return apiRequest('/api/auth/password-reset/confirm', {
    method: 'POST',
    body,
  })
}

/** M-06·M-07: deletes the account at once (cannot be undone) and ends every session. */
export function withdraw(password: string) {
  return apiRequest('/api/members/me/withdrawal', {
    method: 'POST',
    body: { password },
  })
}

/** NTF-09: a member who signed up before email verification gets a code at the sign-up email. */
export function sendMyEmailCode() {
  return apiRequest<SignupVerificationResponse>(
    '/api/members/me/email/verification',
    { method: 'POST' },
  )
}

/** Returns the member with `emailVerified: true`. */
export function confirmMyEmailCode(code: string) {
  return apiRequest<MemberResponse>(
    '/api/members/me/email/verification/confirm',
    { method: 'POST', body: { code } },
  )
}

export function updateMyLanguage(language: Language) {
  return apiRequest<MemberResponse>('/api/members/me', {
    method: 'PATCH',
    body: { language },
  })
}

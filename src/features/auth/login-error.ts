import type { TFunction } from 'i18next'
import { ApiError } from '@/shared/api/client'
import { errorMessage } from '@/shared/i18n/error-message'
import type { LoginFailedDetails } from './api'

function readDetails(error: ApiError): LoginFailedDetails | undefined {
  const { failedAttempts, maxAttempts, remainingAttempts } = error.details ?? {}
  if (
    typeof failedAttempts === 'number' &&
    typeof maxAttempts === 'number' &&
    typeof remainingAttempts === 'number'
  )
    return { failedAttempts, maxAttempts, remainingAttempts }
  return undefined
}

/**
 * LOGIN_FAILED shows the attempt count "(2/5)". remainingAttempts=0 means the
 * account was just locked, so it reads like LOGIN_LOCKED.
 */
export function loginErrorMessage(t: TFunction, error: unknown): string {
  if (error instanceof ApiError && error.code === 'LOGIN_FAILED') {
    const details = readDetails(error)
    if (details?.remainingAttempts === 0) return t('errors.LOGIN_LOCKED')
    if (details)
      return t('login.failedAttempts', {
        failed: details.failedAttempts,
        max: details.maxAttempts,
      })
  }
  return errorMessage(t, error)
}

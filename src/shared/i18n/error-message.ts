import type { TFunction } from 'i18next'
import { ApiError } from '../api/client'
import i18n from './index'

/**
 * i18n key for a thrown error. Server `code` wins; an unknown code falls back
 * to the server message (Korean) as plain text.
 * Keep the key (not the translated text) in form state so a language change
 * re-translates messages already on screen.
 */
export function errorKey(error: unknown): string {
  if (error instanceof ApiError) {
    const key = `errors.${error.code}`
    if (i18n.exists(key)) return key
    if (error.code !== 'HTTP_ERROR' && error.message) return error.message
    return 'errors.UNKNOWN'
  }
  // fetch rejects with TypeError when the network or proxy is unreachable.
  if (error instanceof TypeError) return 'errors.NETWORK'
  return 'errors.UNKNOWN'
}

const keyPattern = /^(errors|validation)\.[A-Za-z_]+$/

/** Translates i18n keys; leaves plain server messages untouched. */
export function translateMessage(
  t: TFunction,
  message: string | undefined,
): string | undefined {
  if (!message) return undefined
  return keyPattern.test(message) ? t(message) : message
}

export function errorMessage(t: TFunction, error: unknown): string {
  return translateMessage(t, errorKey(error)) ?? t('errors.UNKNOWN')
}

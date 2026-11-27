import type { TFunction } from 'i18next'
import { ApiError } from '@/shared/api/client'
import { errorMessage } from '@/shared/i18n/error-message'
import { koreaToday } from '@/shared/i18n/format'
import type { RelatedBillGuide } from './api'

export const photoTypes = 'image/jpeg,image/png'
export const pdfType = 'application/pdf'
export const maxBillBytes = 10 * 1024 * 1024
export const billTranslationPath = '/translations/bills'

export function validateBillFile(file: File, accept: string) {
  if (!accept.split(',').includes(file.type) || file.size === 0)
    return 'BILL_FILE_INVALID'
  if (file.size > maxBillBytes) return 'BILL_FILE_TOO_LARGE'
}

const billErrors = new Set([
  'BILL_CONSENT_REQUIRED',
  'BILL_FILE_INVALID',
  'BILL_FILE_TOO_LARGE',
  'BILL_TRANSLATION_TOO_FREQUENT',
  'BILL_TRANSLATION_LIMIT',
  'AI_UNAVAILABLE',
  'BILL_TRANSLATION_NOT_FOUND',
  'BILL_REMINDER_UNAVAILABLE',
])

export function billErrorMessage(t: TFunction, error: unknown) {
  if (error instanceof ApiError) {
    if (billErrors.has(error.code)) return t(`bill.errors.${error.code}`)
    if (error.status === 413) return t('bill.errors.BILL_FILE_TOO_LARGE')
  }
  return errorMessage(t, error)
}

export function billDaysLeft(date: string, now?: Date) {
  return (Date.parse(date) - Date.parse(koreaToday(now))) / 86_400_000
}

export function billGuidePath({ code, kind }: RelatedBillGuide) {
  if (kind === 'CHECKLIST' || kind === 'LIFE_CHANGE_TASK') {
    return `/home?guide=${encodeURIComponent(code)}#checklist`
  }
  return '/rules?category=tax'
}

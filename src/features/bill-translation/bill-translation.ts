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

/** "D-7", or the words for today and a passed deadline. */
export function billDDayLabel(t: TFunction, date: string | null, now?: Date) {
  if (!date) return null
  const days = billDaysLeft(date, now)
  if (days === 0) return t('bill.today')
  return days < 0 ? t('bill.overdue') : `D-${days}`
}

export function formatBillAmount(amount: number | null, language: string) {
  return amount === null
    ? null
    : new Intl.NumberFormat(language, {
        style: 'currency',
        currency: 'KRW',
      }).format(amount)
}

const opensChecklist = ({ kind }: RelatedBillGuide) =>
  kind === 'CHECKLIST' || kind === 'LIFE_CHANGE_TASK'

/**
 * Guides that can be linked: they have a title, and a checklist item is in the
 * member's checklist (hidden until it is loaded), so no link ends in "not found".
 */
export function visibleBillGuides(
  guides: RelatedBillGuide[],
  checklistItems: { code: string }[] | undefined,
) {
  return guides.filter(
    (guide): guide is RelatedBillGuide & { title: string } =>
      guide.title !== null &&
      (!opensChecklist(guide) ||
        !!checklistItems?.some((item) => item.code === guide.code)),
  )
}

export function billGuidePath(guide: RelatedBillGuide) {
  const { code } = guide
  if (opensChecklist(guide)) {
    return `/home/checklist/${encodeURIComponent(code)}`
  }
  return '/rules?category=tax'
}

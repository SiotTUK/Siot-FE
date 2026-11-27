import type { TFunction } from 'i18next'
import { ApiError } from '@/shared/api/client'
import { errorMessage } from '@/shared/i18n/error-message'
import { koreaToday } from '@/shared/i18n/format'
import { chatBackPath } from '@/shared/lib/chat-back'
import type { RelatedBillGuide } from './api'

export const photoTypes = 'image/jpeg,image/png'
export const pdfType = 'application/pdf'
export const maxBillBytes = 10 * 1024 * 1024
export const billTranslationPath = '/translations/bills'

/**
 * "‹" of a result opened from a chat card goes back to that chat (`/chat` for
 * a new chat without a conversation yet), otherwise to the upload screen.
 */
export function billBackPath(state: unknown) {
  const from = (state as { from?: unknown } | null)?.from
  return from === '/chat' ? from : (chatBackPath(state) ?? billTranslationPath)
}

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

// The line the BE writes under a due date or amount is hidden only when it says
// nothing but the value above it. Anything else, such as an amount due after
// the deadline, stays.

/** Item names of the BE's server summary and of this screen, in 4 languages. */
const dueNames = [
  '납부 기한',
  'Pay by',
  'Payment deadline',
  '缴纳期限',
  '缴费期限',
  'Hạn nộp',
]
const amountNames = [
  '납부 금액',
  'Amount to pay',
  'Amount due',
  '缴纳金额',
  '应缴金额',
  'Số tiền phải nộp',
]

/** "납부 기한: 2026-07-10" → "2026-07-10". Other names are left in place. */
function withoutItemName(line: string, names: string[]) {
  // NFKC also turns the full-width colon "：" into ":".
  const text = line.normalize('NFKC').trim()
  const colon = text.indexOf(':')
  const name = text.slice(0, Math.max(colon, 0)).trim().toLowerCase()
  return names.some((item) => item.normalize('NFKC').toLowerCase() === name)
    ? text.slice(colon + 1).trim()
    : text
}

const lettersAndNumbers = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '')

/** 2026-07-10, 2026.7.10, 2026. 7. 10., 2026년 7월 10일, 2026年7月10日 */
const numericDate =
  /^[^\p{L}\p{N}]*(\d{4})\s*(?:[-./]|년|年)\s*(\d{1,2})\s*(?:[-./]|월|月)\s*(\d{1,2})(?:\s*[일日])?[^\p{L}\p{N}]*$/u

/** Whether the text is that date (YYYY-MM-DD) and nothing else. */
function isOnlyDate(text: string, date: string) {
  const parts = numericDate.exec(text)
  if (parts) {
    const [, year, month, day] = parts
    return (
      `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}` === date
    )
  }
  // Written out the way a screen shows it: "Jul 10, 2026", "July 10, 2026".
  return ['ko', 'en', 'zh', 'vi'].some((language) =>
    (['medium', 'long'] as const).some((dateStyle) => {
      const written = new Intl.DateTimeFormat(language, {
        dateStyle,
        timeZone: 'UTC',
      }).format(new Date(`${date}T00:00:00Z`))
      return lettersAndNumbers(written) === lettersAndNumbers(text)
    }),
  )
}

/** The line under the due date, or undefined when it only repeats the date. */
export function billDueLine(line: string | undefined, dueDate: string | null) {
  if (!line || !dueDate) return line
  return isOnlyDate(withoutItemName(line, dueNames), dueDate) ? undefined : line
}

/** The line under the amount, or undefined when it only repeats the amount. */
export function billAmountLine(
  line: string | undefined,
  amount: number | null,
) {
  if (!line || amount === null) return line
  const text = withoutItemName(line, amountNames)
  // 160,420 · 160.420 (Vietnamese) · 160420
  const found = /\d{1,3}(?:[,.]\d{3})+|\d+/.exec(text)
  if (!found || Number(found[0].replace(/[,.]/g, '')) !== amount) return line
  const rest = [
    text.slice(0, found.index),
    text.slice(found.index + found[0].length),
  ]
    .join(' ')
    .replace(/원|韩元|元|(?<!\p{L})(?:won|krw|đồng|vnd)(?!\p{L})/giu, ' ')
  // Only units and signs such as ₩ may remain: no other letters or numbers.
  return /[\p{L}\p{N}]/u.test(rest) ? line : undefined
}

/** The same name, ignoring spaces and letter case. */
export function sameBillName(a: string, b: string) {
  const bare = (text: string) =>
    text.normalize('NFKC').toLowerCase().replace(/\s/g, '')
  return bare(a) === bare(b)
}

/** Whether `name` repeats the words that end `before`. */
function endsWithName(before: string, name: string) {
  // The repeated name has to start at a word, not in the middle of one.
  const wordStarts = before.matchAll(/(?<![\p{L}\p{M}\p{N}])[\p{L}\p{N}]/gu)
  return [...wordStarts].some(({ index }) =>
    sameBillName(before.slice(index), name),
  )
}

/**
 * Drops parentheses only when they repeat the name before them, also inside a
 * sentence: "카카오페이 (카카오페이)" → "카카오페이". Korean names, web
 * addresses, hours and other notes stay.
 */
export function trimBillParentheses(text: string) {
  return text
    .replace(
      /\s*[(（]([^()（）]*)[)）]/g,
      (match, inner: string, offset: number) =>
        endsWithName(text.slice(0, offset), inner) ? '' : match,
    )
    .trim()
}

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

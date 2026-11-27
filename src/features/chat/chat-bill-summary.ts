import type { TFunction } from 'i18next'
import type { BillTranslation } from '@/features/bill-translation/api'
import {
  formatCalendarDate,
  formatLongMonthDay,
  koreaToday,
} from '@/shared/i18n/format'

type SummaryFields = Pick<
  BillTranslation,
  'documentType' | 'taxKind' | 'amount' | 'dueDate'
>

const taxKinds = ['TAX_CAR', 'TAX_PROPERTY', 'TAX_RESIDENT']

/**
 * The name of the document, or null when it says nothing (OTHER). A reminder or
 * arrears notice is named as such even when the tax is known. `taxType` is not
 * used because it is Korean in every language.
 */
function documentKey({ documentType, taxKind }: SummaryFields) {
  if (
    taxKind &&
    taxKinds.includes(taxKind) &&
    (documentType === null || documentType === 'TAX_NOTICE')
  )
    return taxKind
  return documentType === 'OTHER' ? null : documentType
}

/** "12월 31일"; the year is added when it is not this year in Korea. */
function summaryDate(date: string, language: string, now?: Date) {
  return date.slice(0, 4) === koreaToday(now).slice(0, 4)
    ? formatLongMonthDay(date, language)
    : formatCalendarDate(date, language)
}

/**
 * The same for a passed deadline, with the year spelled out: the short form
 * ends in a period, which cannot be followed by the rest of the sentence.
 */
function passedDate(date: string, language: string, now?: Date) {
  return date.slice(0, 4) === koreaToday(now).slice(0, 4)
    ? formatLongMonthDay(date, language)
    : new Intl.DateTimeFormat(language, {
        dateStyle: 'long',
        timeZone: 'UTC',
      }).format(new Date(`${date}T00:00:00Z`))
}

/** What to pay by when; a passed deadline is only reported as passed. */
function paymentSentence(
  t: TFunction,
  { amount, dueDate }: SummaryFields,
  language: string,
  now?: Date,
) {
  // YYYY-MM-DD compares as text; the deadline day itself has not passed.
  if (dueDate && dueDate < koreaToday(now))
    return t('chat.bill.summary.overdue', {
      date: passedDate(dueDate, language, now),
    })
  const values = {
    amount:
      amount === null
        ? undefined
        : new Intl.NumberFormat(language).format(amount),
    date: dueDate ? summaryDate(dueDate, language, now) : undefined,
  }
  if (values.amount && values.date)
    return t('chat.bill.summary.amountAndDue', values)
  if (values.amount) return t('chat.bill.summary.amount', values)
  return values.date ? t('chat.bill.summary.due', values) : null
}

/**
 * #29 토로's one line above a bill result, built from the result fields with
 * fixed sentences (no AI). A missing value leaves its part out; null when
 * nothing is known.
 */
export function chatBillSummary(
  t: TFunction,
  result: SummaryFields,
  language: string,
  now?: Date,
) {
  const name = documentKey(result)
  const sentences = [
    name && t(`chat.bill.summary.document.${name}`),
    paymentSentence(t, result, language, now),
  ].filter(Boolean)
  // Chinese puts no space between sentences.
  return sentences.join(language === 'zh' ? '' : ' ') || null
}

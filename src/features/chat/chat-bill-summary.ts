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
  const amount =
    result.amount === null
      ? null
      : new Intl.NumberFormat(language).format(result.amount)
  const date = result.dueDate
    ? summaryDate(result.dueDate, language, now)
    : null
  const sentences = [
    name && t(`chat.bill.summary.document.${name}`),
    amount !== null && date !== null
      ? t('chat.bill.summary.amountAndDue', { amount, date })
      : amount !== null
        ? t('chat.bill.summary.amount', { amount })
        : date !== null
          ? t('chat.bill.summary.due', { date })
          : null,
  ].filter(Boolean)
  // Chinese puts no space between sentences.
  return sentences.join(language === 'zh' ? '' : ' ') || null
}

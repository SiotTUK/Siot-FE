import type { TFunction } from 'i18next'
import { formatKoreaUpdatedAt } from '../i18n/format'

/**
 * Formats TanStack Query's `dataUpdatedAt` for the M13 load-failure card (#36).
 * Returns `undefined` when no previous data has been loaded (`0` / missing).
 */
export function lastUpdatedText(
  t: TFunction,
  dataUpdatedAt: number | null | undefined,
  language: string,
): string | undefined {
  const time = formatKoreaUpdatedAt(dataUpdatedAt, language)
  return time ? t('common.lastUpdated', { time }) : undefined
}

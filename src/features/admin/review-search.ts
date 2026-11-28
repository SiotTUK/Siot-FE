import type { ReviewSearch } from './api'

/** BE limit for the ADM-08 text search. */
export const reviewKeywordMax = 100

/** "#32" or "32" → 32; anything else is not an answer number. */
export function toMessageId(value: string) {
  const digits = value.trim().replace(/^#/, '')
  return /^\d{1,15}$/.test(digits) ? Number(digits) : undefined
}

/**
 * ADM-08 search sent to the BE: the answer number, and the text matched in
 * the masked question, answer and feedback (100 characters at most).
 */
export function toReviewSearch(id: string, keyword: string): ReviewSearch {
  return {
    messageId: toMessageId(id),
    keyword: keyword.trim().slice(0, reviewKeywordMax) || undefined,
  }
}

import { describe, expect, it } from 'vitest'
import { toMessageId, toReviewSearch } from './review-search'

describe('ADM-08 review search', () => {
  it('reads an answer number with or without #', () => {
    expect(toMessageId('32')).toBe(32)
    expect(toMessageId(' #32 ')).toBe(32)
    expect(toMessageId('3a')).toBeUndefined()
    expect(toMessageId('')).toBeUndefined()
  })

  it('sends only what was typed, trimmed and within 100 characters', () => {
    expect(toReviewSearch('', '  ')).toEqual({
      messageId: undefined,
      keyword: undefined,
    })
    expect(toReviewSearch('#7', ' 건강보험 ')).toEqual({
      messageId: 7,
      keyword: '건강보험',
    })
    expect(toReviewSearch('', 'a'.repeat(120)).keyword).toHaveLength(100)
  })
})

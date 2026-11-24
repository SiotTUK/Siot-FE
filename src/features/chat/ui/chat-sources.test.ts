import { describe, expect, it } from 'vitest'
import type { SourceResponse } from '../api'
import { groupChatSources } from './chat-sources'

const guide = {
  documentName: '생활안내',
  sourceUrl: 'https://example.org/guide.pdf',
  relevanceScore: null,
}

function source(
  order: number,
  pageStart: number | null,
  pageEnd: number | null = null,
  overrides: Partial<SourceResponse> = {},
): SourceResponse {
  return { ...guide, order, pageStart, pageEnd, ...overrides }
}

describe('groupChatSources', () => {
  it('merges repeated and overlapping citations in a single document', () => {
    const groups = groupChatSources([
      source(2, 10),
      source(1, 9, 10),
      source(3, 10, 10),
      source(4, 12),
    ])

    expect(groups).toEqual([
      {
        order: 1,
        documentName: guide.documentName,
        sourceUrl: guide.sourceUrl,
        pages: [9, 10, 12],
      },
    ])
  })

  it('lists pages in order and documents by first citation', () => {
    const otherUrl = 'https://example.org/other.pdf'
    const sources = [
      source(5, 10, 10),
      source(2, 9, null, { sourceUrl: otherUrl }),
      source(3, 9),
      source(1, 12),
      source(4, 8, null, { documentName: '다른 생활안내' }),
    ]
    const groups = groupChatSources(sources)

    expect(groups.map(({ order }) => order)).toEqual([1, 2, 4])
    expect(groups[0]?.pages).toEqual([9, 10, 12])
    expect(groups[1]?.sourceUrl).toBe(otherUrl)
    expect(groups[1]?.pages).toEqual([9])
    expect(groups[2]?.documentName).toBe('다른 생활안내')
    expect(sources.map(({ order }) => order)).toEqual([5, 2, 3, 1, 4])
  })

  it('keeps deleted and partially identified citations separate', () => {
    const deleted = { documentName: null, sourceUrl: null }
    const groups = groupChatSources([
      source(1, null, null, deleted),
      source(2, null, null, deleted),
      source(3, 9, null, { sourceUrl: null }),
      source(4, 10, null, { sourceUrl: '' }),
      source(5, 11, null, { sourceUrl: null }),
      source(6, 12, null, { documentName: null }),
      source(7, 13, null, { documentName: null }),
      source(8, null),
    ])

    expect(groups.map(({ pages }) => pages)).toEqual([
      [],
      [],
      [9],
      [10],
      [11],
      [12],
      [13],
      [],
    ])
  })

  it('compacts long contiguous runs and keeps short runs and gaps visible', () => {
    const [group] = groupChatSources([
      source(1, 8, 500),
      source(2, 1, 7),
      source(3, 400, 450),
      source(4, 502, 511),
      source(5, 513, 523),
    ])

    expect(group?.pages).toEqual([
      { start: 1, end: 500 },
      502,
      503,
      504,
      505,
      506,
      507,
      508,
      509,
      510,
      511,
      { start: 513, end: 523 },
    ])
  })
})

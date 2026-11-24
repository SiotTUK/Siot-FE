import { describe, expect, it } from 'vitest'
import type { SourceResponse } from './api'
import { groupSources } from './sources'

const source = (
  order: number,
  documentName: string | null,
  pageStart: number | null,
  pageEnd: number | null = null,
  sourceUrl: string | null = null,
): SourceResponse => ({
  order,
  documentName,
  pageStart,
  pageEnd,
  sourceUrl,
  relevanceScore: null,
})

describe('groupSources', () => {
  it('shows the same document once with its pages merged', () => {
    const groups = groupSources([
      source(1, '학사 안내', 9, 10),
      source(2, '학사 안내', 10),
      source(3, '학사 안내', 10, null, 'https://example.com/a.pdf'),
    ])
    expect(groups).toEqual([
      {
        key: 'doc-학사 안내',
        documentName: '학사 안내',
        pages: [{ start: 9, end: 10 }],
        sourceUrl: 'https://example.com/a.pdf',
      },
    ])
  })

  it('keeps separate ranges and document order', () => {
    const groups = groupSources([
      source(2, 'B', 3),
      source(1, 'A', 20),
      source(3, 'A', 4, 5),
      source(4, 'A', 6),
    ])
    expect(groups.map((group) => group.documentName)).toEqual(['A', 'B'])
    expect(groups[0].pages).toEqual([
      { start: 4, end: 6 },
      { start: 20, end: 20 },
    ])
  })

  it('does not merge deleted documents with each other', () => {
    const groups = groupSources([source(1, null, 1), source(2, null, 2)])
    expect(groups).toHaveLength(2)
  })
})

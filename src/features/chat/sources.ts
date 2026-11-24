import type { SourceResponse } from './api'

export interface PageRange {
  start: number
  end: number
}

/** One chip per document: the chunks the answer cited, merged. */
export interface SourceGroup {
  key: string
  documentName: string | null
  /** Overlapping or adjacent ranges merged, ascending, e.g. 9~10쪽 + 10쪽 → 9~10쪽. */
  pages: PageRange[]
  sourceUrl: string | null
}

/**
 * Groups cited chunks by document so the same document shows once. Deleted
 * documents (no name) cannot be told apart, so each stays on its own.
 */
export function groupSources(sources: SourceResponse[]): SourceGroup[] {
  const groups = new Map<string, SourceGroup & { ranges: PageRange[] }>()
  for (const source of [...sources].sort((a, b) => a.order - b.order)) {
    const key =
      source.documentName === null
        ? `deleted-${source.order}`
        : `doc-${source.documentName}`
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        documentName: source.documentName,
        pages: [],
        ranges: [],
        sourceUrl: null,
      }
      groups.set(key, group)
    }
    group.sourceUrl ??= source.sourceUrl
    if (source.pageStart !== null) {
      const end = source.pageEnd ?? source.pageStart
      group.ranges.push({
        start: Math.min(source.pageStart, end),
        end: Math.max(source.pageStart, end),
      })
    }
  }
  return [...groups.values()].map(({ ranges, ...group }) => ({
    ...group,
    pages: mergeRanges(ranges),
  }))
}

function mergeRanges(ranges: PageRange[]): PageRange[] {
  const merged: PageRange[] = []
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1)
    if (last && range.start <= last.end + 1)
      last.end = Math.max(last.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}
